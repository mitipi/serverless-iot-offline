const {parseSelect} = require('../iotSql/parseSql')
const {applySelect} = require('../iotSql/applySqlSelect')
const {applyWhereClause} = require('../iotSql/applySqlWhere')
const {topic, timestamp, clientid, accountid} = require('../iotSql/sqlFunctions')
const {sqlParseTestData} = require('../testData')

const log = () => {}
const fnName = 'test_function'

describe('SQL parser', () => {
  beforeAll(() => {
    process.env.AWS_ACCOUNT_ID = 'test_account'
  })

  afterAll(() => {
    delete process.env.AWS_ACCOUNT_ID
  })

  test('should parse and apply SQL correctly', () => {

    sqlParseTestData.forEach((data) => {
      const {sql, expected, payload} = data
      const parsed = parseSelect(sql)
      expect(parsed).toEqual(expected.parsed)
      expect(applyWhereClause(payload, parsed.whereClause, log, fnName)).toBe(expected.whereEvaluatesTo)
      expect(applySelect({
        select: parsed.select,
        payload: JSON.parse(payload),
        context: {
          topic: (index) => topic(index, parsed.topic),
          clientid: () => clientid(parsed.topic),
          accountid: () => accountid()
        }
      })).toEqual(expected.event)
    })
  })

  test('should parse and apply SQL with timestamp function', () => {
    const sql = `SELECT state.reported.preferences as pref, timestamp() as curr_time FROM '$aws/things/+/shadow/get/accepted' WHERE (state.reported.preferences.volume > 30 OR state.desired.preferences.volume > 30) AND state.reported.activities.length > 0`
    const payload = `{"state": {"reported": {"activities": [{"activityId":1}], "preferences": {"volume":31}}}}`

    const parsed = parseSelect(sql)
    expect(parsed).toEqual({
      select: [{alias: 'pref', field: 'state.reported.preferences'}, {alias: 'curr_time', field: 'timestamp()'}],
      topic: '$aws/things/+/shadow/get/accepted',
      whereClause: '(state.reported.preferences.volume > 30 OR state.desired.preferences.volume > 30) AND state.reported.activities.length > 0'
    })

    expect(applyWhereClause(payload, parsed.whereClause, log, fnName)).toBeTruthy()
    const event = applySelect({
      select: parsed.select,
      payload: JSON.parse(payload),
      context: {
        timestamp: () => timestamp()
      }
    })
    expect(event).toHaveProperty('curr_time')
    expect(event).toHaveProperty('pref')
  })
})
