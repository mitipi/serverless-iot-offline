module.exports.sqlParseTestData = [
  {
    sql: `SELECT topic(3) as deviceId, * FROM '$aws/things/sn:123/shadow/update' WHERE NOT state.reported.client.confirmed`,
    payload: `{"state": {"reported": {"client": {"confirmed": false}}}}`,
    expected: {
      parsed: {
        select: [{alias: 'deviceId', field: 'topic(3)'}, {field: '*'}],
        topic: '$aws/things/sn:123/shadow/update',
        whereClause: 'NOT state.reported.client.confirmed'
      },
      whereEvaluatesTo: true,
      event: {
        deviceId: 'sn:123',
        state: {reported: {client: {confirmed: false}}}
      }
    }
  },
  {
    sql: `SELECT state.reported.preferences.*, state.reported.activity as activityId FROM '$aws/things/+/shadow/update/accepted' WHERE state.reported.preferences.volume > 30`,
    payload: `{"state": {"reported": {"preferences": {"volume": 31}, "activity": 1}}}`,
    expected: {
      parsed: {
        select: [{field: 'state.reported.preferences.*'}, {field: 'state.reported.activity', alias: 'activityId'}],
        topic: '$aws/things/+/shadow/update/accepted',
        whereClause: 'state.reported.preferences.volume > 30'
      },
      whereEvaluatesTo: true,
      event: {
        volume: 31,
        activityId: 1
      }
    }
  },
  {
    sql: `SELECT state.desired.client FROM '$aws/things/+/shadow/update/accepted' WHERE state.desired.client = TRUE`,
    payload: `{"state": {"desired": {"client": true}}}`,
    expected: {
      parsed: {
        select: [{field: 'state.desired.client'}],
        topic: '$aws/things/+/shadow/update/accepted',
        whereClause: 'state.desired.client = TRUE'
      },
      whereEvaluatesTo: true,
      event: {
        client: true
      }
    }
  },
  {
    sql: `SELECT *, topic(), topic(2), topic(3), topic(4) FROM '$aws/things/+/shadow/update' WHERE state.reported.mode = 'STAND_BY'`,
    payload: `{"state": {"reported": {"mode": "STAND_BY"}}}`,
    expected: {
      parsed: {
        select: [
          {field: '*'},
          {field: 'topic()'},
          {field: 'topic(2)'},
          {field: 'topic(3)'},
          {field: 'topic(4)'}
        ],
        topic: '$aws/things/+/shadow/update',
        whereClause: `state.reported.mode = 'STAND_BY'`
      },
      whereEvaluatesTo: true,
      event: {
        state: {reported: {mode: 'STAND_BY'}},
        topic: '$aws/things/+/shadow/update',
        'topic(2)': 'things',
        'topic(3)': '+',
        'topic(4)': 'shadow'
      }
    }
  },
  {
    sql: `SELECT clientid(), accountid() as account FROM '$aws/events/presence/connected/test_client'`,
    payload: `{"event": "connected"}`,
    expected: {
      parsed: {
        select: [{field: 'clientid()'}, {field: 'accountid()', alias: 'account'}],
        topic: '$aws/events/presence/connected/test_client'
      },
      whereEvaluatesTo: true,
      event: {
        account: 'test_account',
        clientid: 'test_client'
      }
    }
  }
]
