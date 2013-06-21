'use strict';
// var _ = require('lodash')
require('templates/tasks')
require('html5sortable')

module.exports = A.View.extend({
  template: A.Templates['tasks/taskList']
  , events: {
    'sortupdate #taskList': 'sorted'
  }
  , collectionItem: {
    'tasks/taskListItem': {}
  }
  , collectionContainer: '#taskList'
  , initialize: function(){
    this.listenTo(this.collection, 'add', this.render)
    this.listenTo(this.collection, 'remove', this.render)
  }
  , postRender: function(){
    this.$(this.collectionContainer).sortable({
      forcePlaceholderSize: true
    })
  }
  , sorted: function(e, ui){
    this.collection.get(ui.item[0].id).save({order: ui.item.index()})
  }
})
