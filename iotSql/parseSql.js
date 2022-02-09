const SQL_REGEX = /^SELECT (.*) FROM '([^']+)'/
const SELECT_PART_REGEX = /^(.*?)(?: as (.*))?$/i
const FIELDS_REGEX = /((\w+[\n\r\s]*\([^)]*\))|([^\n\r\s(,]+))([\n\r\s]+as[\n\r\s]+\w*)?/g
const WHERE_REGEX = /WHERE (.*)/

const parseSelect = sql => {
  const [select, topic] = sql.match(SQL_REGEX).slice(1)
  const [whereClause] = (sql.match(WHERE_REGEX) || []).slice(1)

  return {
    select: select.match(FIELDS_REGEX).map(parseSelectPart),
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
