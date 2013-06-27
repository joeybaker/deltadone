/*global describe, it, before, after*/
'use strict';

var Resource = require('../app/resource.js')
  , chai = require('chai')
  , Backbone = require('backbone')
  , Hapi = require('hapi')
  , request = require('request')
  , config = require('../config/test.json')
  , server = new Hapi.Server('localhost', config.port)
  , should = chai.should()

// stub: backbone.sync, resource depends on this being overriddenjj
Backbone.sync = function(method, model, options){
  options.success.call()
}

describe('resources', function(){
  it('has events', function(done){
    var resource = new Resource('events', server)
    resource.on('test', function(){
      resource.off.should.be.a('function')
      done()
    })
    resource.trigger('test')
  })
  it('creates a new collection from a collection name', function(){
    var resource = new Resource('newcollection', server)

    resource.collection.should.be.an.instanceof(Backbone.Collection)
  })
  it('accepts a collection as a creation argument', function(){
    var Test2 = Backbone.Collection.extend({
        url: '/exisitngcollection'
      })
      , test2 = new Test2()
      , resource = new Resource(test2, server)

    resource.collection.should.be.an.instanceof(Backbone.Collection)
  })
  // it('populates the collection if it has no models', function(done){
  //   var Test2 = Backbone.Collection.extend({
  //       url: 'test2'
  //     })
  //     , test2 = new Test2()
  //     , resource

  //   test2.on('sync', function(){
  //     console.log('sync')
  //     resource.collection.length.should.equal(test2.length)
  //     done()
  //   })

  //   resource = new Resource(test2, server)

  //   resource.collection.should.be.an.instanceof(Backbone.Collection)
  //   resource.collection.length.should.equal(0)
  // })

  describe('routes', function(){
    before(function(done){
      server.start(done)
    })

    it('creates a routing table', function(){
      server.routingTable().should.exist
    })

    describe('#read', function(){
      it('presents JSON', function(done){
        var Read = Backbone.Collection.extend({
            url: '/read'
          })
          , read = new Read()
          , resource = new Resource(read, server)

        resource.collection.should.exist

        for (var i = 0, l = 3; i < l; i++){
          read.create({id: i})
        }

        request({
          url: 'http://localhost:' + config.port + '/read'
          , json: true
          }, function(err, res, body){
            should.not.exist(err)
            body.length.should.equal(l)
            done()
        })
      })
      it('returns a single model if specified', function(done){
        var Read2 = Backbone.Collection.extend({
            url: '/read2'
          })
          , read = new Read2()
          , resource = new Resource(read, server)

        resource.collection.should.exist

        for (var i = 0, l = 3; i < l; i++){
          read.create({id: i})
        }

        request({
          url: 'http://localhost:' + config.port + '/read2/' + 1
          , json: true
          }, function(err, res, body){
            should.not.exist(err)
            body.id.should.equal(1)
            done()
        })
      })
    })

    describe('#create', function(){
      it('adds to the server\'s collection', function(done){
        var Collection = Backbone.Collection.extend({
            url: '/create'
          })
          , collection = new Collection()
          , resource = new Resource(collection, server)

        resource.collection.should.exist

        request.post({
          url: 'http://localhost:' + config.port + '/create'
          , json: true
          , body: {id: 1}
          , timeout: 2000
          }, function(err, res, body){
            should.not.exist(err)
            body.id.should.equal(1)
            collection.first().id.should.equal(1)
            done()
        })
      })
      it('emits a create event', function(done){
        var Collection = Backbone.Collection.extend({
            url: '/create2'
          })
          , collection = new Collection()
          , resource = new Resource(collection, server)

        resource.collection.should.exist

        request.post({
          url: 'http://localhost:' + config.port + '/create2'
          , json: true
          , body: {id: 1}
          , timeout: 2000
        })

        resource.on('create', function(model){
          model.should.exist
          done()
        })
      })
    })

    describe('#update', function(){
      it('changes a model', function(done){
        var Collection = Backbone.Collection.extend({
            url: '/update'
          })
          , collection = new Collection()
          , resource = new Resource(collection, server)

        resource.collection.should.exist

        for (var i = 0, l = 10; i < l; i++){
          collection.create({id: i, value: 'initial'})
        }

        request.put({
          url: 'http://localhost:' + config.port + '/update/1'
          , json: true
          , body: {id: 1, value: 'updated'}
          , timeout: 2000
          }, function(err, res, body){
            should.not.exist(err)
            body.id.should.equal(1)
            collection.get(1).get('value').should.equal('updated')
            collection.get(2).get('value').should.equal('initial')
            done()
        })
      })
      it('emits an update event', function(done){
        var Collection = Backbone.Collection.extend({
            url: '/update2'
          })
          , collection = new Collection()
          , resource = new Resource(collection, server)

        resource.collection.should.exist

        for (var i = 0, l = 10; i < l; i++){
          collection.create({id: i, value: 'initial'})
        }

        request.put({
          url: 'http://localhost:' + config.port + '/update2/1'
          , json: true
          , body: {id: 1, value: 'updated'}
          , timeout: 2000
        })

        resource.on('update', function(model){
          model.should.exist
          model.get('value').should.equal('updated')
          done()
        })
      })
      it('throws an error when updating a model that doesn\'t exist', function(done){
        var Collection = Backbone.Collection.extend({
            url: '/update3'
          })
          , collection = new Collection()
          , resource = new Resource(collection, server)

        resource.collection.should.exist

        for (var i = 0, l = 10; i < l; i++){
          collection.create({id: i, value: 'initial'})
        }

        request.put({
          url: 'http://localhost:' + config.port + '/update3/100'
          , json: true
          , body: {id: 1, value: 'updated'}
          , timeout: 2000
          }, function(err, res, body){
            should.not.exist(err)
            res.statusCode.should.equal(404)
            body.code.should.equal(404)
            done()
        })
      })
    })

    describe('#delete', function(){
      it('removes it from the server collection', function(done){
        var Collection = Backbone.Collection.extend({
            url: '/delete'
          })
          , collection = new Collection()
          , resource = new Resource(collection, server)

        resource.collection.should.exist

        for (var i = 0, l = 10; i < l; i++){
          collection.create({id: i, value: 'initial'})
        }

        request.del({
          url: 'http://localhost:' + config.port + '/delete/1'
          , json: true
          , timeout: 2000
          }, function(err, res, body){
            should.not.exist(err)
            should.not.exist(body)
            res.statusCode.should.equal(204)
            should.not.exist(collection.get(1))
            done()
        })
      })
      it('emits a delete event', function(done){
        var Collection = Backbone.Collection.extend({
            url: '/delete2'
          })
          , collection = new Collection()
          , resource = new Resource(collection, server)

        resource.collection.should.exist

        for (var i = 0, l = 10; i < l; i++){
          collection.create({id: i})
        }

        resource.on('delete', function(){
          should.not.exist(collection.get(1))
          done()
        })

        request.del({
          url: 'http://localhost:' + config.port + '/delete2/1'
          , json: true
          , timeout: 2000
        })

      })
    })

    after(function(done){
      server.stop(done)
    })
  })
})
