/*global describe, it*/
'use strict';

var Resource = require('../app/resource.js')
  , resource = new Resource('test')
  , Backbone = require('backbone')

describe('resources', function(){
  it('has events', function(done){
    resource.on('test', function(){
      resource.off.should.be.a('function')
      done()
    })
    resource.trigger('test')
  })
  it('has a collection', function(){
    resource.collection.should.be.an.instanceof(Backbone.Collection)
  })
  it('populates the collection if the data is empty')

  describe('read', function(){
    it('presents JSON')
    it('has models with ids')
  })
  describe('create', function(){
    it('saves to the data store')
    it('returns a success to the client')
    it('emits a create event')
    it('adds it to the server collection')
  })
  describe('update', function(){
    it('finds the model to change')
    it('updates the data store')
    it('returns a success to the client')
    it('emits an update event')
  })
  describe('delete', function(){
    it('finds the model to mark removed')
    it('updates the data store')
    it('returns a success to the client')
    it('emits a delete event')
    it('removes it from the server collection')
  })
})
