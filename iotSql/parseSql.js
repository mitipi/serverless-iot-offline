const BASE64_PLACEHOLDER = '*b64'
const SQL_REGEX = /^SELECT (.*) FROM '([^']+)'/
const SELECT_PART_REGEX = /^(.*?)(?: as (.*))?$/i
const WHERE_REGEX = /WHERE (.*)/

const parseSelect = sql => {
  const [select, topic] = sql.match(SQL_REGEX).slice(1)
  const [whereClause] = (sql.match(WHERE_REGEX) || []).slice(1)

  return {
    select: select
    // hack
      .replace("encode(*, 'base64')", BASE64_PLACEHOLDER)
      .split(',')
      .map(s => s.trim())
      .map(parseSelectPart),
    topic,
    whereClause
  }
}

const parseSelectPart = part => {
  const [field, alias] = part.match(SELECT_PART_REGEX).slice(1)
  return {
    field,
    alias
  }
}

module.exports = {parseSelect}
