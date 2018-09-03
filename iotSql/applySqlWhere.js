const _ = require('lodash')
const WhereParser = require('./whereParser')

const conjunctionMap = {
  'OR': '||',
  'AND': '&&',
  'NOT': '!'
}

const operatorMap = {
  '<>': '!==',
  '=': '==='
}

const valueMap = {
  'TRUE': 'true',
  'FALSE': 'false'
}

const applyWhereClause = (message, clause, log, fnName) => {
  if (!clause) {
    return true
  }

  const parser = new WhereParser()
  const whereClauseAst = parser.parse(clause)
  let payload
  let condition = ''
  try {
    payload = JSON.parse(message)
  } catch (e) {
    log(`Topic payload is not JSON, skipping SQL WHERE clause for function: ${fnName}. Error: ${e}`)
    return false
  }

  whereClauseAst.forEach((block) => {
    if (Array.isArray(block)) {
      condition += '('
      block.forEach((item) => {
          condition += buildCondition(item)
      })
      condition += ')'
    } else {
      condition += `${buildCondition(block)}`
    }
  })

  try {
    const result = eval(condition)
    return result
  } catch (e) {
    log(`Error executing WHERE clause for function: ${fnName}. Error: ${e}`)
    return false
  }
}

const buildCondition = (item) => {
  if (item.type === 'conjunction') {
    return ` ${conjunctionMap[item.value]} `
  } else {
    return `(_.get(payload, '${item.key}', {}) ${operatorMap[item.operator] || item.operator} ${valueMap[item.value] || item.value})`
  }
}

module.exports = {applyWhereClause}
