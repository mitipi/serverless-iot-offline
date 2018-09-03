module.exports = {
  topic: (index, topicUrl) => (typeof index !== 'undefined') ? topicUrl.split('/')[(index - 1)] : topicUrl,
  clientid: (topicUrl) => {
    if (/^\$aws\/events/.test(topicUrl)) {
      return topicUrl.slice(topicUrl.lastIndexOf('/') + 1)
    } else {
      return ''
    }
  },
  timestamp: () => (new Date()).getTime(),
  accountid: () => process.env.AWS_ACCOUNT_ID
}
