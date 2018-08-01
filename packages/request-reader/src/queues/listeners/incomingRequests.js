const {services: {requests}, context: {mq}} = require('stox-bc-request-manager-common')

module.exports = async ({body: message}) => {
  try {
    await requests.createRequest(message)
  } catch (e) {
    if (message.type) {
      requests.publishCompletedRequest({...message, error: e})
    } else {
      mq.publish('error-requests', {...message, error: e})
    }

    throw e
  }
}
