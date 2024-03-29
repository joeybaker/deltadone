'use strict';

var Backbone = require('backbone')
  , _ = require('lodash')

module.exports = Backbone.Router.extend({
  initialize: function(options){
    this.options = _.defaults((options || {}), {
      collections: 'collections/'
      , controllers: 'controllers/'
      , views: 'views/'
      , app: {}
    })
    this.options.app = _.defaults(this.options.app, {
      Views: {}
      , Templates: {}
      , Renders: {}
      , Collections: {}
      , Datas: {}
      , Models: {}
      , Router: this
    })

    Backbone.history.on('route', function(router){
      if (!this._started) return
      // TODO: we're still leaking DOM elements. need to use .remove()
      if (router._currentFragment && router.options.app.Renders[router._currentFragment]) router.options.app.Renders[router._currentFragment].undelegateEvents()
      router._currentFragment = Backbone.history.fragment || 'home'
      router.options.app.Renders[router._currentFragment].delegateEvents()
    })

    if (_.isFunction(options.parseRoutes)) options.parseRoutes(options)
    else this._addRoutes(options)

    if (Backbone.history.start({pushState: _.isUndefined(options.pushState) ? true : options.pushState})) this._started = true
  }
  , _addRoutes: function(options){
    _.each(options.actions, function(action, actionName){
      this[actionName] = action
    }, this)
    _.each(options.routes, function(actionName, route){
      this.route(route, actionName)
    }, this)
  }
  , _parseRoutes: function(options){
    var routes = options.routesJSON
    _.each(routes, function(actions, path){
      // marrying director style routes to backbone style routes
      var pathParsed = (path.charAt(0) === '/' ? path.substring(1) : path).replace('*', '*splat').replace(/\(\/\)|\//, '') + '(/)'

      _.each(actions, function(controllerAction, method){
        var self = this
          , actionParts = controllerAction.split('#')
          , controller = method.charAt(0) === '3' ? 'redirect' : require(options.controllers + actionParts[0])
          , fn = actionParts[1] || method
          , action = fn === 'render' ? console.error('You can\'t define a render method. It\'s reserved by the router.') : controller[fn]

        // if this is a redirect
        if (controller === 'redirect') this.route(pathParsed, ['redirect', pathParsed].join(''), function(){
          self.navigate(controllerAction, {replace: true, trigger: true})
        })

        if (method === 'get') this.route(pathParsed, controllerAction, function(){
          var params = action.apply(self, _.values(arguments))

          self.render(params.view, params.collection, params)
        })
      }, this)
    }, this)
  }
  , render: function(view, collection, options){
    var collectionData = !this._started ? window._bootstrapData : null
      , self = this
      , done = function(coll){
        self._setView(view, coll, options).render()
      }

    if (!collection) done.call(this)
    else this._fetchCollection(this._setCollection(collection, collectionData), done)

    if (options && options.title) document.title = options.title
  }
  , _setCollection: function(collectionName, collectionData){
    this.options.app.Collections[collectionName] = require(this.options.collections + collectionName)
    this.options.app.Datas[collectionName] = this.options.app.Datas[collectionName] || new this.options.app.Collections[collectionName](collectionData)
    return this.options.app.Datas[collectionName]
  }
  , _fetchCollection: function(collection, callback){
    var done = typeof callback === 'function' ? callback : function(){}
    // if we already have data, don't fetch again
    if (collection.length > 2) {
      done(collection)
      return collection
    }

    collection.fetch({
      context: this
      , error: function(collection, status, jqXHR){
        console.error(status.status, collection.url, jqXHR, collection)
      }
      , success: function(){
        done(collection)
      }
    })
    return collection
  }
  , _setView: function(path, collection, opts){
    var data = this._getViewData(opts, collection)
      , options = _.extend((opts || {}), {
        collection: collection
        , data: data.data
      })
    if (data.model) options.model = data.model

    if (_.isFunction(options.setModel)) options.model = options.setModel(collection)

    this.options.app.Views[path] = require(this.options.views + path)
    // use the history fragment here, so that we're sure we're caching views by URL, and not view name which could be the same for many URLs
    this.options.app.Renders[Backbone.history.fragment || 'home'] = this.options.app.Renders[Backbone.history.fragment || 'home'] || new this.options.app.Views[path](options)
    return this.options.app.Renders[Backbone.history.fragment || 'home']
  }
  , _getViewData: function(opts, collection){
    var result = {}

    if (!opts || !(opts.data && opts.model)) return result

    if (_.isFunction(opts.data)) result.data = opts.data.call(this, collection)
    else if (_.isPlainObject(opts.data) || _.isArray(opts.data)) result.data = opts.data

    if (_.isFunction(opts.model)) result.model = opts.model.call(this, collection)
    else if (opts.model instanceof Backbone.Model) result.model = opts.model

    return result
  }
})
