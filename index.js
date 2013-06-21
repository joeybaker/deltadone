'use strict';
var server = require('./app/server')
  , pkg = require('./package.json')

// Start the server
server.start(server.app.port, function(err) {
  if (err) console.error(err)
  console.info('      name :', pkg.name)
  console.info('   version :', pkg.version)
  console.info('started at :', Date())
  console.info('   on port :', server.app.port)
  console.info('   in mode :', process.env.NODE_ENV)
})
