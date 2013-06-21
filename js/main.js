'use strict';
(function(){
  var $ = require('../components/jquery/jquery.js')
    , _ = require('lodash')
    // , Backbone = require('backbone')
    , Router = require('./router.js')
    , FastClick = require('../components/fastclick/lib/fastclick')
    , Handlebars = require('handlebars-runtime')

  window.$ = $
  window._ = _
  window.Handlebars = Handlebars


  // patch lodash for underscore compatibility; needed for backbone-relational
  _.findWhere = _.first

  window.A = _.extend((window.A || {}), {
    View: require('./view.js')
    , Model: require('./model.js')
    , $container: $('#main')
  })

  window.A.Router = new Router({
    routes: {
      '(/)': 'tasks'
    }
    , actions: {
      tasks: function(){
        console.log('tasks')
        this.render('tasks/index', 'tasks', {title: 'tasks'})
      }
    }
    , app: window.A
  })

  window.A.Router.on('route', function(router, route){
    console.log(route)
  })


  ;new FastClick(document.body)

})()

