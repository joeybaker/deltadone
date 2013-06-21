'use strict';

var path = require('path')
  , config = require(path.join('../config/', process.env.NODE_ENV.toLowerCase() + '.json'))
  , _ = require('lodash')
  , Hapi = require('hapi')
  , server = new Hapi.Server('localhost', config.port, {})
  , Database = require('./db.js')
  , db
_.str = require('underscore.string')
server.app = config

// production gets special settings
db = new Database(server, {
  host: config.db.host
  , port: process.env.NODE_ENV === 'production' ? 6984 : 5984
  , secure: process.env.NODE_ENV === 'production'
  , auth: process.env.NODE_ENV === 'production' ? {username: '', password: ''} : undefined
  , name: 'deltadone3'
})

server.views({
  path: path.join(process.cwd(), 'views')
  , partialsPath: path.join(process.cwd(), 'views')
  , engines: {
    hbs: 'handlebars'
  }
  , layout: true
  , layoutKeyword: '_yield'
  , isCached: process.env.NODE_ENV !== 'development'
})

server.route([
  {
    method: 'GET'
    , path: '/'
    , config: {
      handler: function(req){
        var data = []
        for (var i = 0, l = 10; i < l; i++){
          data[i] = {
            subject: 'task ' + i
            , _id: 'task/' + i
          }
        }
        req.reply.view('tasks/index.hbs', {tasks: data, _development: process.env.NODE_ENV})
      }
    }
  }
  , {
    method: 'GET'
    , path: '/api/v1/{collection}'
    , handler: function(req){
      var data = []
      for (var i = 0, l = 10; i < l; i++){
        data[i] = {
          subject: 'task' + i
        }
      }

      req.reply(data)
    }
  }
  , {
    method: 'POST'
    , path: '/api/v1/{collection}'
    , handler: function(req){
      server.log(['info'], req.payload)
      req.reply(req.payload)
    }
  }
  , {
    method: 'GET'
    , path: '/assets/{path*}'
    , handler: {
      directory: {
        path: './assets'
        , listing: false
        , index: false
      }
    }
  }
])

server.on('log', function(e, tags){
  var logged = false

  _.each(tags, function(tag){
    if (console[tag]){
      console[tag](tags, e)
      logged = true
    }
  })

  if (!logged) console.log(tags, e)
})

server.db = db
module.exports = server
