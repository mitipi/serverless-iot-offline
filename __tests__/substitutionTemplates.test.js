'use strict'

const { fillSubstitutionTemplates } = require('../iotSql/substitutionTemplates')

describe('AWS IoT Substitution Templates', () => {

  describe('fillSubstitutionTemplates', () => {
    const topicCombinations = [
      {
        concrete: 'my/things/MY_DEVICE/shadow/update',
        template: '$$aws/things/${topic(3)}/shadow/update',
        expected: '$$aws/things/MY_DEVICE/shadow/update'
      },
      {
        concrete: 'things/MY_DEVICE_001/test/topic',
        template: 'my/things/${topic(2)}/test/topic',
        expected: 'my/things/MY_DEVICE_001/test/topic'
      },
      {
        concrete: 'things/MY_DEVICE_002/test/topic',
        template: '$aws/events/presence/connected/${topic(2)}',
        expected: '$aws/events/presence/connected/MY_DEVICE_002',
      },
      {
        concrete: 'MY_DEVICE_003/test/topic',
        template: '$$aws/things/test/${topic(1)}',
        expected: '$$aws/things/test/MY_DEVICE_003',
      },
      {
        concrete: 'part1/part2/part3',
        template: '$$aws/${topic(3)}/${topic(2)}/${topic(1)}',
        expected: '$$aws/part3/part2/part1',
      }
    ]

    topicCombinations.forEach(topics => {
      it(`${topics.concrete.padEnd(33)} -> ${topics.template.padEnd(42)} = ${topics.expected.padEnd(44)}`, () => {
        const substituted = fillSubstitutionTemplates(topics.concrete, topics.template)
        expect(substituted).toBe(topics.expected)
      })
    })
  })

})
