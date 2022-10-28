const _ = require('lodash')

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
  accountid: () => process.env.AWS_ACCOUNT_ID,
  encode: (message, field, encoding) => {
    if (encoding !== "base64") {
      throw new Error(
        "AWS Iot SQL encode() function only supports base64 as an encoding"
      );
    }
    if (field === "*") {
      return Buffer.from(message).toString("base64");
    }

    let payload;
    try {
      payload = JSON.parse(message);
    } catch (e) {
      console.log(e);
    }

    const value = _.get(payload, field);
    if (!value) {
      throw new Error(
        `Failed to evaluate encode(${field}, 'base64'): Cannot find ${field} in payload`
      );
    }
    return Buffer.from(value.toString()).toString("base64");
  },
}
