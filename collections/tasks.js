'use strict';
var Backbone = require('backbone')
  , model = require('../models/task')

module.exports = Backbone.Collection.extend({
  url: '/api/v1/tasks'
  , model: model
  , comparator: function(model){
    return model.get('order') || Infinity
  }
  // auto-increment the order of models that fall below the model if the order has changed
  // setOrSave defaults to 'save'
  , incrementOrder: function(model, index, setOrSave){
    if (model.get('order') !== index) {
      this.each(function(m){
        if (m.get('order') >= index && m.id !== model.id) m[setOrSave || 'save']({order: parseInt(m.get('order'), 10) + 1})
      })
    }
  }

})
