const AWSMock = require('aws-sdk-mock')
const path = require('path')

module.exports = (client, redisClient) => {
  AWSMock.mock('IotData', 'publish', (params, callback) => {
    const {topic, payload} = params
    client.publish(topic, payload, callback)
  })

  AWSMock.mock('IotData', 'getThingShadow', (params, callback) => {
    redisClient.get(params.thingName, (err, result) => {
      callback(err || null, {payload: result})
    })
  })

  AWSMock.mock('IotData', 'updateThingShadow', (params, callback) => {
    client.publish(`$aws/things/${params.thingName}/shadow/update`, params.payload, callback)
  })

  AWSMock.mock('Iot', 'createPolicy', (params, callback) => {
    redisClient.get(params.policyName, (err, data) => {
      if (err || data) {
        callback(data ? {code: 'ResourceAlreadyExistsException'} : err)
      } else {
        const policy = {
          versions: {
            '1': {
              policyDocument: params.policyDocument,
              targets: [],
              timestamp: (new Date()).getTime()
            }
          },
          defaultVersion: '1'
        }
        redisClient.set(params.policyName, JSON.stringify(policy), (err) => {
          if (err) {
            callback(err)
          } else {
            callback(null, {
              policyDocument: params.policyDocument,
              policyName: params.policyName,
              policyVersionId: 1,
              policyArn: ''
            })
          }
        })
      }
    })
  })

  AWSMock.mock('Iot', 'listTargetsForPolicy', (params, callback) => {
    redisClient.get(params.policyName, (err, res) => {
      if (err || !res) {
        callback(err || {message: `Policy ${params.policyName} does not exists`})
      } else {
        const policy = JSON.parse(res)
        callback(null, {targets: policy.versions[policy.defaultVersion].targets})
      }
    })
  })

  AWSMock.mock('Iot', 'detachPolicy', (params, callback) => {
    redisClient.get(params.policyName, (err, res) => {
      if (err || !res) {
        callback(err || {message: `Policy ${params.policyName} does not exists`})
      } else {
        const policy = JSON.parse(res)
        const principal = `${process.env.AWS_ACCOUNT_ID}:${params.target}`
        const targets = policy.versions[policy.defaultVersion].targets
        const index = targets.indexOf(principal)
        if (index !== -1) {
          targets.splice(index, 1)
        }

        redisClient.set(params.policyName, JSON.stringify(policy), (err) => {
          if (err) {
            callback(err)
          } else {
            callback(null)
          }
        })
      }
    })
  })

  AWSMock.mock('Iot', 'attachPolicy', (params, callback) => {
    redisClient.get(params.policyName, (err, res) => {
      if (err || !res) {
        callback(err || {message: `Policy ${params.policyName} does not exists`})
      } else {
        const policy = JSON.parse(res)
        const principal = `${process.env.AWS_ACCOUNT_ID}:${params.target}`
        const targets = policy.versions[policy.defaultVersion].targets
        if (!targets.find((target) => target === principal)) {
          targets.push(principal)
        }

        redisClient.set(params.policyName, JSON.stringify(policy), (err) => {
          if (err) {
            callback(err)
          } else {
            callback(null)
          }
        })
      }
    })
  })
}
