'use strict';
// var Backbone = require('backbone')
  // , _ = require('lodash')

module.exports = A.Model.extend({
  idAttribute: '_id'
  , defaults: {
    type: 'task'
    , author: '' //email
    , subject: ''
    , content: ''
    , createdDate: new Date()
    , updatedDate: new Date()
    , location: {} //url:, geo:
    , comments: []
    , meta: {
      due: {
        date: null
        , location: null
      }
      , start: {
        date: null
        , location: null
      }
      , done: {
        date: null
        , location: null
      }
      , order: null
      , status: 'open'
      , list: null
      , assignee: null // should default to current user
    }
    , isDeleted: false
  }
  , initialize: function(){
    // this.on('change', function(){
    //   this.save({updatedDate: new Date()})
    // })
    this.on('invalid', function(){
      console.error('invalid', arguments[1].message, arguments)
    })
  }
  , validate: function(){
    // console.log('validate')
    // if (!_.isString(attrs.author)) return {message: 'Author must be an email'}
    // if (!_.isString(attrs.subject)) return {message: 'Subject must be a string'}
    // if (!_.isString(attrs.content)) return {message: 'Content must be a string'}
    // if (!_.isDate(attrs.createDate)) return {message: 'Created Date must be a date'}
    // if (!_.isDate(attrs.updatedDate)) return {message: 'Updated Date must be a date'}
  }

})
