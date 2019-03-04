const functionHelper = require('serverless-offline/src/functionHelper')
const createLambdaContext = require('serverless-offline/src/createLambdaContext')
const path = require('path')
const {parseSelect} = require('./iotSql/parseSql')
const {applySelect} = require('./iotSql/applySqlSelect')
const {applyWhereClause} = require('./iotSql/applySqlWhere')
const {applyActions} = require('./iotSql/applyActions')
const { fillSubstitutionTemplates } = require('./iotSql/substitutionTemplates')
const mqtt = require('mqtt')
const mqttMatch = require('mqtt-match')
const _ = require('lodash')
const {topic, accountid, clientid, timestamp} = require('./iotSql/sqlFunctions')

/**
 * Searches serverless.yml for functions configurations.
 * Creates mqtt client which connects to Iot broker and subscribes to topics that are defined in discovered functions.
 * Links discovered functions to topic and calls them when their topic gets published.
 */
module.exports = (slsOptions, slsService, serverless, log) => {
  const {location} = slsOptions
  const topicsToFunctionsMap = {}
  const republishMap = {}

  Object.keys(slsService.functions).forEach(key => {
    const fun = getFunction(key, slsService)
    const servicePath = path.join(serverless.config.servicePath, location)
    const funOptions = functionHelper.getFunctionOptions(fun, key, servicePath)

    if (!fun.environment) {
      fun.environment = {}
    }

    if (!(fun.events && fun.events.length)) {
      return
    }

    fun.events.forEach(event => {
      if (!event.iot) return

      const {iot} = event
      const {sql, actions} = iot

      const parsed = parseSelect(sql)
      const topicMatcher = parsed.topic
      if (!topicsToFunctionsMap[topicMatcher]) {
        topicsToFunctionsMap[topicMatcher] = []
      }

      topicsToFunctionsMap[topicMatcher].push({
        fn: fun,
        name: key,
        options: funOptions,
        select: parsed.select,
        whereClause: parsed.whereClause,
        actions
      })
    })
  })

  // search in resources for Iot rule events
  const resources = _.get(slsService, 'resources.Resources', {})
  Object.keys(resources).forEach(key => {
    const ruleConf = _.get(slsService.resources.Resources[key], 'Properties.TopicRulePayload')

    if (!ruleConf || ruleConf.RuleDisabled === "true") {
      return
    }

    registerLambdaRules(key, ruleConf)
    registerRepublishRules(key, ruleConf)

    function registerLambdaRules (key, ruleConf) {
      const actions = []
      const sql = ruleConf.Sql
      const parsed = parseSelect(sql)
      const topicMatcher = parsed.topic
      let fun
      let funName
      let funOptions

      if (!topicsToFunctionsMap[topicMatcher]) {
        topicsToFunctionsMap[topicMatcher] = []
      }

      ruleConf.Actions.forEach((action) => {
        if (action.Lambda) {
          const awsFunName = action.Lambda.FunctionArn['Fn::GetAtt'][0]
          funName = _.lowerFirst(awsFunName).replace('LambdaFunction', '')
          fun = getFunction(funName, slsService)
          const servicePath = path.join(serverless.config.servicePath, location)
          funOptions = functionHelper.getFunctionOptions(fun, key, servicePath)

          if (!fun.environment) {
            fun.environment = {}
          }
        } else {
          actions.push(action)
        }
      })

      if (fun && funName && funOptions) {
        topicsToFunctionsMap[topicMatcher].push({
          fn: fun,
          name: funName,
          options: funOptions,
          select: parsed.select,
          whereClause: parsed.whereClause,
          actions
        })
      } else {
        delete topicsToFunctionsMap[topicMatcher]
      }
    }

    function registerRepublishRules (key, ruleConf) {
      ruleConf.Actions
        .filter(action => action.Republish)
        .forEach(republishAction => {
          const topicMatcher = parseSelect(ruleConf.Sql).topic

          if (!republishMap[topicMatcher]) {
            republishMap[topicMatcher] = []
          }
          const cleanedRepublishTopic = cleanRepublishTopic(republishAction.Republish.Topic)
          republishMap[topicMatcher].push({
            republishTopic: cleanedRepublishTopic
          })
        })

        function cleanRepublishTopic(topic) {
          return topic.replace(/^\${2}/, '$')
        }
    }
  })

  const client = mqtt.connect(`ws://${slsOptions.host}:${slsOptions.httpPort}/mqqt`)
  client.on('connect', () => {
    log('Rule engine connected to IOT broker')
    for (let topicMatcher in topicsToFunctionsMap) {
      client.subscribe(topicMatcher)
    }
    for (let topicMatcher in republishMap) {
      client.subscribe(topicMatcher)
    }
  })

  client.on('message', (topicUrl, message) => {
    const functionMatches = Object.keys(topicsToFunctionsMap).filter(topicMatcher => mqttMatch(topicMatcher, topicUrl))
    if (functionMatches.length > 0) {
      functionMatches.forEach(triggerLambdaRules)
    }

    const republishMatches = Object.keys(republishMap).filter(topicMatcher => mqttMatch(topicMatcher, topicUrl))
    if (republishMatches.length > 0) {
      republishMatches.forEach(topicMatcher => {
        triggerRepublishRules(topicMatcher, topicUrl, message)
      })
    }

    function triggerLambdaRules (topicMatcher) {
      let functions = topicsToFunctionsMap[topicMatcher]
      functions.forEach(fnInfo => {
        const {fn, name, options, select, whereClause, actions} = fnInfo
        const requestId = Math.random().toString().slice(2)

        if (applyWhereClause(message, whereClause, log, name)) {
          let handler // The lambda function
          const event = applySelect({
            select,
            payload: message,
            context: {
              topic: (index) => topic(index, topicUrl),
              clientid: () => clientid(topicUrl),
              timestamp: () => timestamp(),
              accountid: () => accountid()
            }
          })

          if (actions && actions.length) {
            applyActions(actions, event, log)
          }

          try {
            process.env = _.extend({}, slsService.provider.environment, slsService.functions[name].environment, process.env)
            handler = functionHelper.createHandler(options, slsOptions)
          } catch (err) {
            log(`Error while loading ${name}: ${err.stack}, ${requestId}`)
            return
          }

          const lambdaContext = createLambdaContext(fn)
          try {
            handler(event, lambdaContext, lambdaContext.done)
          } catch (error) {
            log(`Uncaught error in your '${name}' handler: ${error.stack}, ${requestId}`)
          }
        }
      })
    }

    function triggerRepublishRules(topicMatcher, topicUrl, originalMessage) {
      if (republishMap[topicMatcher]) {
        republishMap[topicMatcher].forEach(republishRule => {
          const republishTopic = fillSubstitutionTemplates(topicUrl, republishRule.republishTopic)
          client.publish(republishTopic, originalMessage, () => {
            console.log(`Republished from: "${topicUrl}", to: "${republishTopic}"`)
          })
        })
      }

    }
  })
}

const getFunction = (key, slsService) => {
  const fun = slsService.getFunction(key)
  if (!fun.timeout) {
    fun.timeout = slsService.provider.timeout
  }

  return fun
}
