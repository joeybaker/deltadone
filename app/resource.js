'use strict';

var Backbone = require('backbone')
  , _ = require('lodash')
  , Hapi = require('hapi')
  , path = require('path')
  , Resource = function(collection, server, callback){
    var cb = !callback ? function(){} : callback

    if (!(server instanceof Hapi.Server)) {
      console.error('Must pass resource a Hapi Server as the second argument')
      return cb('Must pass resource a Hapi Server as the second argument')
    }

    this.init(collection, server, cb)
  }

Resource.prototype = {
  init: function(collection, server, callback){
    // establish the collection
    if (collection instanceof Backbone.Collection) this.collection = collection
    else if (_.isString(collection) && server && server.app.datas && server.app.datas[collection]) this.collection = server.app.datas[collection]
    else if (_.isString(collection)) {
      this.Collection = Backbone.Collection.extend({
        url: path.join('/', collection)
      })
      this.collection = new this.Collection()
    }

    // get collection data
    if (this.collection.length === 0) this.collection.fetch({
      context: this
      , error: function(err){
        server.log(['error', 'resource'], err)
      }
      , success: function(collection){
        callback(collection)
      }
    })

    server.route([
      {
        method: 'GET'
        , path: path.join('/', this.collection.url)
        , config: {
          handler: function(req){
            req.reply(this.read())
          }.bind(this)
        }
      }
      , {
        method: 'GET'
        , path: path.join('/', this.collection.url, '/{id}')
        , config: {
          handler: function(req){
            req.reply(this.read(parseInt(req.params.id, 10)))
          }.bind(this)
        }
      }
      , {
        method: 'POST'
        , path: path.join('/', this.collection.url)
        , config: {
          handler: function(req){
            this.create(req.payload, function(err, model){
              if (err) {
                req.log(['error', 'resource', 'create'], err)
                return req.reply(err).code(500)
              }

              req.log(['resource', 'info', 'create'], 'created: ' + this.collection.url +model.id)
              req.reply(_.pick(model.attributes, function(val, key){
                return key.indexOf('_') === 0 || key === model.idAttribute
              })).code(206)
            }.bind(this))
          }.bind(this)
        }
      }
      , {
        method: 'PUT'
        , path: path.join('/', this.collection.url, '/{id}')
        , config: {
          handler: function(req){
            this.update(req.params.id, req.payload, function(err, model){
              if (err) {
                req.log(['error', 'resource', 'update'], err)
                return req.reply(err).code(err.code)
              }

              req.log(['resource', 'info', 'update'], 'updated: ' + this.collection.url + model.id)
              req.reply(_.pick(model.attributes, function(val, key){
                return key.indexOf('_') === 0 || key === model.idAttribute
              })).code(206)
            }.bind(this))
          }.bind(this)
        }
      }
      , {
        method: 'DELETE'
        , path: path.join('/', this.collection.url, '/{id}')
        , config: {
          handler: function(req){
            this['delete'](req.params.id, function(err, model){
              if (err) {
                req.log(['error', 'resource', 'delete'], err)
                return req.reply(err).code(err.code)
              }

              req.log(['resource', 'info', 'delete'], 'deleted: ' + this.collection.url + model.id)
              req.reply().code(204) // 204 == action complete, no response
            }.bind(this))
          }.bind(this)
        }
      }
    ])
  }
  , read: function(id){
    if (id) return this.collection.get(id).toJSON()
    else return this.collection.toJSON()
  }
  , create: function(model, cb){
    this.collection.create(model, {
      error: function(model, res){
        cb(res)
      }
      , success: function(model){
        cb(undefined, model)
        this.trigger('create', model)
      }.bind(this)
      , wait: true
    })
  }
  , update: function(id, updates, cb){
    var model = this.collection.get(id)

    if (!model) return cb({code: 404, message: 'Model ' + id + ' does not exist.'})

    model.save(updates, {
      error: function(modelUpdated, res){
        cb({code: 500, message: res})
      }
      , success: function(modelUpdated){
        cb(undefined, modelUpdated)
        this.trigger('update', modelUpdated)
      }.bind(this)
      , wait: true
    })
  }
  , 'delete': function(id, cb){
    var model = this.collection.get(id)

    if (!model) return cb({code: 404, message: 'Model ' + id + ' does not exist.'})

    model.destroy({
      error: function(modelUpdated, res){
        cb({code: 500, message: res})
      }
      , success: function(modelUpdated){
        cb(undefined, modelUpdated)
        this.trigger('delete')
      }.bind(this)
      , wait: true
    })
  }
}


_.extend(Resource.prototype, Backbone.Events)

module.exports = Resource
