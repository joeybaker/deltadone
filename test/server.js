/* global describe, it, before, after*/
'use strict';

var chai = require('chai')

chai.should()

process.env.NODE_ENV = 'test'

describe('The server', function(){
  var server

  before(function(){
    server = require('../app/server.js')
  })

  it('starts', function(done){
    server.start(done)
  })
  it('builds a routing table from collections')
  it('has a routing table', function(){
    server.routingTable().should.be.an('array')

  })
  it('has a data store', function(){
    server.db.should.exist
  })

  after(function(done){
   server.stop(done)
  })
})
