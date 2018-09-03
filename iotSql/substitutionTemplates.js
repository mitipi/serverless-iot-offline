'use strict'

function fillSubstitutionTemplates (concreteTopic, templatedTopic) {
  const substitutionTemplateRegExp = /(?:\$\{topic\()(\d{1,2})(?:\)\})/
  while (substitutionTemplateRegExp.test(templatedTopic)) {
    const substitutionIndex = templatedTopic.match(substitutionTemplateRegExp)[1] - 1
    const split = templatedTopic.split('/')
    const placeholderIndex = split.findIndex(topicPiece => substitutionTemplateRegExp.test(topicPiece))

    const substitutionVariable = concreteTopic.split('/')[substitutionIndex]
    split[placeholderIndex] = substitutionVariable
    templatedTopic = split.join('/')
  }
  return templatedTopic
}

module.exports = {
  fillSubstitutionTemplates
}
