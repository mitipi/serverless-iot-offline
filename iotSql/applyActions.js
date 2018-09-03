const AWS = require('aws-sdk')
const _ = require('lodash')
let log

/**
 * Applies actions defined for iot rules in serverless.yml
 * @example
 * // dynamoDBv2 action - writes event payload into a table
 * dynamoDBv2:
 *  roleArn: "some_role_arn or reference to an arn"
 *  putItem:
 *    tableName: SomeTable
 */
module.exports.applyActions = (actions, payload, _log) => {
  log = _log
  actions.forEach((action) => {
    if (action.DynamoDBv2) {
      handleDynamoDBV2Action(_.get(action, 'DynamoDBv2.PutItem.TableName'), payload)
    }
  })
}

const handleDynamoDBV2Action = (tableName, payload) => {
  if (!tableName) {
    return log('DynamoDBv2 error: table name not defined')
  }

  const offlineOptions = {
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  }

  const docClient = new AWS.DynamoDB.DocumentClient(offlineOptions)
  const params = {
    TableName: tableName,
    Item: payload
  }

  docClient.put(params, (err) => {
    if (err) {
      log('DynamoDBv2 action error', err)
    } else {
      log('DynamoDBv2 action successful')
    }
  })
}
