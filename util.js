const path = require('path')
const fs = require('fs')

const removeNulledProps = (shadow) => {
  let obj = JSON.parse(JSON.stringify(shadow))
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === 'object') {
      removeNulledProps(obj[key])
    } else if (obj[key] == null) {
      delete obj[key]
    }
  });
  return obj
}

module.exports.removeNulledProps = removeNulledProps

module.exports.getTopics = (serialNumber) => {
  return {
    updateAccepted: `$aws/things/${serialNumber}/shadow/update/accepted`,
    updateDocuments: `$aws/things/${serialNumber}/shadow/update/documents`,
    updateDelta: `$aws/things/${serialNumber}/shadow/update/delta`,
    updateRejected: `$aws/things/${serialNumber}/shadow/update/rejected`,
    getAccepted: `$aws/things/${serialNumber}/shadow/get/accepted`,
    getRejected: `$aws/things/${serialNumber}/shadow/get/rejected`,
    deleteAccepted: `$aws/things/${serialNumber}/shadow/delete/accepted`,
    deleteRejected: `$aws/things/${serialNumber}/shadow/delete/rejected`
  }
}

module.exports.seedShadows = (seedPath, redisClient) => {
  const location = path.join(process.cwd(), seedPath)
  fs.exists(location, (exists) => {
    if (exists) {
      const shadows = require(location)
      Object.keys(shadows).forEach((serialNumber) => {
        redisClient.set(serialNumber, JSON.stringify(shadows[serialNumber]))
        redisClient.set(`${serialNumber}Version`, '1')
      })
    }
  })
}

module.exports.seedPolicies = (seedPath, redisClient) => {
  if(!seedPath) return
  const location = path.join(process.cwd(), seedPath)
  fs.exists(location, (exists) => {
    if (exists) {
      const policies = require(location)
      Object.keys(policies).forEach((policyName) => {
        redisClient.set(policyName, JSON.stringify(policies[policyName]))
      })
    }
  })
}

module.exports.errObj = (message) => {
  return {
    code: 500,
    message,
    timestamp: new Date().getTime(),
    clientToken: 'token'
  }
}
