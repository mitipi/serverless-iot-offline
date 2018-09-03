'use strict';

const _ = require('lodash')
const createBroker = require('./broker')
const createShadowService = require('./shadowService')
const iotMock = require('./iotMock')
const ruleHandler = require('./ruleHandler')
const {seedShadows, seedPolicies} = require('./util')

const defaultOpts = {
  host: 'localhost',
  location: '.',
  port: 1883,
  httpPort: 1884,
  noStart: false,
  skipCacheInvalidation: false
}

class ServerlessIotPlugin {
  constructor (serverless, options) {
    this.serverless = serverless
    this.log = serverless.cli.log.bind(serverless.cli)
    this.service = serverless.service
    this.options = options
    this.provider = 'aws'
    this.topics = {}

    this.commands = {
      iot: {
        commands: {
          start: {
            usage: 'Start local Iot broker.',
            lifecycleEvents: ['startHandler'],
            options: {
              host: {
                usage: 'host name to listen on. Default: localhost',
                // match serverless-offline option shortcuts
                shortcut: 'o'
              },
              port: {
                usage: 'MQTT port to listen on. Default: 1883',
                shortcut: 'p'
              },
              httpPort: {
                usage: 'http port for client connections over WebSockets. Default: 1884',
                shortcut: 'h'
              },
              skipCacheInvalidation: {
                usage: 'Tells the plugin to skip require cache invalidation. A script reloading tool like Nodemon might then be needed',
                shortcut: 'c',
              },
            }
          }
        }
      }
    }

    this.hooks = {
      'iot:start:startHandler': this.startHandler.bind(this),
      'before:offline:start:init': this.startHandler.bind(this),
      'before:offline:start': this.startHandler.bind(this),
      'before:offline:start:end': this.endHandler.bind(this),
    }
  }

  startHandler () {
    this.options = _.merge({}, defaultOpts, _.get(this.service, 'custom.iot', {}), this.options)

    this.mqttBroker = createBroker({
      host: this.options.host,
      port: this.options.port,
      http: {
        host: this.options.host,
        port: this.options.httpPort,
        bundle: true
      }
    }, this.log)

    const {client, redisClient} = createShadowService(this.options, this.log)
    seedShadows(this.options.seedShadows, redisClient)
    seedPolicies(this.options.seedPolicies, redisClient)
    iotMock(client, redisClient)
    ruleHandler(this.options, this.service, this.serverless, this.log)
  }

  endHandler () {
    this.log('Stopping Iot broker')
    this.mqttBroker.close()
  }
}

module.exports = ServerlessIotPlugin
