/*global describe, it, after, before */
'use strict';
var Backbone = require('backbone')
  , Database = require('../app/db.js')
  , Hapi = require('hapi')
  , config = require('../config/test.json')
  , server = new Hapi.Server('localhost', config.port)
  , db

// server.on('log', function(e, tags){
//   console.log(tags, e)
// })

describe('db', function(){
  before(function(done){
    new Database(server, {
       name: 'deltadone-test'
     }, function(database){
       db = database
       done()
     })
  })

  it('has a database', function(done){
    db.exists(function(err, exists){
      exists.should.be.true
      done()
    })
  })
  it('can write data', function(done){
    db.save('first', {value: 1}, function(err, res){
      res.ok.should.be.ok
      done()
    })
  })
  it('can update data', function(done){
    db.merge('first', {value: 2, second: true}, function(err, res){
      res.ok.should.be.true
      done()
    })
  })
  it('can read data', function(done){
    db.get('first', function(err, res){
      res.value.should.equal(2)
      res.second.should.be.true
      done()
    })
  })
  it('can delete data', function(done){
    db.remove('first', function(err, res){
      res.ok.should.be.true
      done()
    })
  })

  describe('Backbone Sync', function(){
    var Model = Backbone.Model.extend({
      defaults: {
        name: null
        , value: null
      }
      , idAttribute: '_id'
    })
    , Collection = Backbone.Collection.extend({
      model: Model
      , url: '/testers'
    })
    , testers = new Collection()

    it('can save a collection to the db', function(done){
      testers.create({
        name: 'testing a name'
      }, {
        success: function(model, res){
          res.id.should.be.a('string')
          model.get('name').should.equal('testing a name')
          done()
        }
        , error: function(model, xhr){
          console.error(xhr)
          xhr.should.not.exist
          done()
        }
      })
    })
    it('can update a model', function(done){
      testers.first().save({name: 'testing again'}, {
        success: function(model, res){
          model.get('name').should.equal('testing again')
          res._rev.should.exist
          done()
        }
        , error: function(model, xhr){
          console.error(xhr)
          xhr.should.not.exist
          done()
        }
      })
    })
    it('can delete a model', function(done){
      testers.first().destroy({
        success: function(model, res){
          res._rev.should.exist
          done()
        }
        , error: function(model, xhr){
          console.error(xhr)
          xhr.should.not.exist
          done()
        }
      })
    })
    it('can fetch a collection', function(done){
      testers.create({name: 'fetch test'}, {
        success: function(){
          testers.length.should.equal(1)
          testers.reset()
          testers.length.should.equal(0)

          testers.fetch({
            reset: true
            , success: function(collection){

              collection.findWhere({name: 'fetch test'}).get('name').should.equal('fetch test')
              done()
            }
            , error: function(model, xhr){
              console.error(xhr)
              xhr.should.not.exist
              done()
            }
          })
        }
      })
    })
  })

  after(function(done){
    db.destroy(done)
  })
})
