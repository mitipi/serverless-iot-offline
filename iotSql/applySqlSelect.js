const _ = require('lodash')
const evalInContext = require('./eval')

const BASE64_PLACEHOLDER = '*b64'
const brace = new Buffer('{')[0]
const bracket = new Buffer('[')[0]
const doubleQuote = new Buffer('"')[0]

// to avoid stopping here when Stop on Caught Exceptions is on
const maybeParseJSON = val => {
  switch (val[0]) {
    case brace:
    case bracket:
    case doubleQuote:
      try {
        return JSON.parse(val)
      } catch (err) {
      }
  }

  return val
}

const applySelect = ({select, payload, context}) => {
  let event = {}
  const json = maybeParseJSON(payload)

  // if payload is Buffer initialize Buffer class from base64 string
  const payloadReplacement = Buffer.isBuffer(payload)
    ? `new Buffer('${payload.toString('base64')}', 'base64')`
    : payload

  // iterate over select parsed array
  // ex. [{alias: 'serialNumber', field: 'topic(2)'}, {field: 'state.reported.preferences.*'}]
  for (let part of select) {
    let {alias, field} = part

    if (field === '*') {
      // if select part has alias, add that alias as property and assign payload as value
      if (alias) {
        event[alias] = json
      } else {
        // else add whole payload to event
        event = _.merge(event, json)
      }
      // check if field is sqlFunction
    } else if (Object.keys(context).some((sqlFunc) => (new RegExp(`${sqlFunc}\\((.*)\\)`).test(field)))) {
      let js = field.replace(BASE64_PLACEHOLDER, payloadReplacement)
      // execute sqlFunction
      event[alias || field.replace(/\(()\)/, '')] = evalInContext(js, context)
    } else {
      // event is some property on shadow
      let propPath = field.split('.')
      let prop = propPath[propPath.length - 1]
      if (prop === '*') {
        propPath = propPath.slice(0, -1)
        if (alias) {
          event[alias] = _.get(json, propPath.join('.'))
        } else {
          event = _.merge(event, _.get(json, propPath.join('.')))
        }
      } else {
        event[alias || prop] = _.get(json, propPath.join('.'))
      }
    }
  }

  return event
}

module.exports = {applySelect}
