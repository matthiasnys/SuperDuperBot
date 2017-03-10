'use strict'
var https = require('https')

// Variables => Use config our external token service.
var botname = 'TheSuperDuperBot'
var slackToken = 'xoxp-151301575776-152007960738-152341649861-059b8f894debc63f11d1897e7febd58e' //This key is invalid: Use your own Key

module.exports.sendMessage = (event, context, callback) => {
  var body = JSON.parse(event.body)
  var visitor = body.visitor
  var host = body.host

  getUserlist(slackToken, function (error, list) { // Use slacktoken to get Userlist
    if (error !== null) {
      httpCallback('Could not get userlist from slack.com', 404, callback)
    } else if (list !== null) {
      var user = filterList(list, host) // Filter the list on Email or First and last name
      if (user === null) {
        httpCallback(error || 'Could not find slack-user', 404, callback)
      } else {
        console.log('FOUND: ' + user.profile.real_name)
        sendSlackMessage(slackToken, user.id, message(visitor, host), function (error, json) {
          if (error !== null) {
            httpCallback(error || 'Could not send slack message to slack.com', 400, callback)
          } else {
            httpCallback('Message has been sent', 200, callback)
          }
        })
      }
    }
  })
}

function httpCallback (message, code, callback) {
  const response = {
    statusCode: code,
    body: JSON.stringify({
      message: message
    })
  }
  callback(null, response)
}

function message (visitor, host) {
  var message = 'Your visitor ' + visitor.first_name + ' ' + visitor.last_name + ' has arrived.'
  return message
}

function filterList (list, host) {
  for (var i = 0; i < list.length; i++) {
    var user = list[i]
    if (user.profile.email === host.email || (user.profile.first_name === host.first_name && user.profile.last_name === host.last_name)) {
      return user
    }
  }
  return null
}

function getUserlist (slackToken, callback) {
  var options = {
    'method': 'GET',
    'hostname': 'slack.com',
    'port': null,
    'path': '/api/users.list?token=' + slackToken + '&presence=true&pretty=1',
    'headers': {
      'cache-control': 'no-cache'
    }
  }

  var req = https.request(options, function (res) {
    var chunks = []

    res.on('data', function (chunk) {
      chunks.push(chunk)
    })

    res.on('end', function () {
      var body = Buffer.concat(chunks)
      var json = JSON.parse(body)
      console.log('Get Slack Userlist: ' + JSON.stringify(json))
      var list = json.members
      callback(null, list)
    })
  }).on('error', function (e) {
    console.log('Get Slack Userlist: Got error: ' + e.message)
    callback(e)
  })

  req.end()
}

function sendSlackMessage (slackToken, userId, message, callback) {
  var encodedMessage = encodeURI(message)
  var options = {
    'method': 'GET',
    'hostname': 'slack.com',
    'port': null,
    'path': '/api/chat.postMessage?token=' + slackToken + '&channel=' + userId + '&text=' + encodedMessage + '&username=' + encodeURI(botname) + '&pretty=1&as_user=false',
    'headers': {
      'cache-control': 'no-cache'
    }
  }

  var req = https.request(options, function (res) {
    var chunks = []

    res.on('data', function (chunk) {
      chunks.push(chunk)
    })

    res.on('end', function () {
      var body = Buffer.concat(chunks)
      var json = JSON.parse(body)
      console.log('Send Slack Message: ' + JSON.stringify(json))
      callback(null, json)
    })
  }).on('error', function (e) {
    console.log('Send Slack Message: Got error: ' + e.message)
    callback(e)
  })

  req.end()
}
