'use strict';
// var _ = require('lodash')
require('templates/tasks')

module.exports =  A.View.extend({
  template: A.Templates['tasks/taskListItem']
  , tagName: 'li'
  , className: 'row'
  , attributes: function(){
    return {
      id: 'task-' + this.model.id
    }
  }
  , events: {
    'change input[type="checkbox"]': 'setStatus'
  }
  , initialize: function(){
    this.listenTo(this.model, 'change', this.render)
  }
  , setStatus: function(e){
    this.model.save({status: !this.model.get('status')}, {
      // error: function(){
      //   console.error.apply(null, arguments)
      // }
      // , success: function(){
      //   console.log.apply(null, arguments)
      // }
    })
    return e
  }
})
