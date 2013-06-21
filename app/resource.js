'use strict';

var Backbone = require('backbone')
  , _ = require('lodash')
  , resource = function(collection, server){
    this.init(collection, server)
  }

resource.prototype = {
  init: function(collection, server){
    if (typeof collection === Backbone.Collection) this.collection = collection
    else if (_.isString(collection) && server && server.app.datas[collection]) this.collection = server.app.datas[collection]
    else if (_.isString(collection)) {
      this.Collection = Backbone.Collection.extend({
        url: '/api/v1/' + collection
      })
      this.collection = new this.Collection()
    }
  }
  , read: function(id){
    id
  }
  , create: function(){}
  , update: function(id){
    id
  }
  , remove: function(id){
    id
  }
}

_.extend(resource.prototype, Backbone.Events)

module.exports = resource
