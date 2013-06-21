module.exports = function(grunt){
  'use strict';
  var path = require('path')
    , fs = require('fs')
    , folderMount = function folderMount(connect, point) {
      return connect.static(path.resolve(point))
    }
    , gitMasterBranch = 'master'
    , bowerrc = grunt.file.readJSON('./.bowerrc')
    , components = bowerrc.directory || './components'

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json')
    , config: grunt.file.readJSON(path.join('./config/', process.env.NODE_ENV.toLowerCase() + '.json'))
    , meta: {
      version: '<%= pkg.version %>'
      , banner: '/*! <%= pkg.name %> - v<%= meta.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n'
    }
    , jshint: {
      all: [
        'Gruntfile.js'
        , 'index.js'
        , 'app/**/*.js'
        , 'test/**/*.js'
        , '<%= watch.js.files %>'
        , '!<%= browserify.dev.dest %>'
      ]
      , options: {
        jshintrc: '.jshintrc'
      }
    }
    , less: {
      dev: {
        options: {
          dumpLineNumbers: 'all'
        }
        , files: {
          'assets/main.css': 'less/main.less'
        }
      }
      , production: {
        options: {
          dumpLineNumbers: false
          , compress: true
        }
        , files: '<%= less.dev.files %>'
      }
    }
    , browserify: {
      dev: {
        src: './js/main.js'
        , dest: './assets/main.min.js'
        , options: {
          debug: true
          , shim: {
            // jquery: {
            //   path: path.join(components, '/jquery/jquery.js')
            //   , exports: '$'
            // }
            // handlebars: {
            //   path: path.join(components, '/handlebars/handlebars.runtime.js')
            //   , exports: 'Handlebars'
            // }
            html5sortable: {
              path: path.join(components, '/html5sortable/jquery.sortable.js')
              , exports: 'html5sortable'
            }
          }
          , aliasMappings: [
            {
              cwd: './views/'
              , src: ['**/*.js']
              , dest: 'views/'
              , rename: function(dest, matchedSrcPath) {
                return path.join(dest, matchedSrcPath).replace('/_', '/')
              }
            }
            , {
              cwd: './collections/'
              , src: ['**/*.js']
              , dest: 'collections/'
            }
            , {
              cwd: './models/'
              , src: ['**/*.js']
              , dest: 'models/'
            }
            , {
              cwd: './tmp/templates/'
              , src: ['**/*.js']
              , dest: 'templates/'
              // , rename: function(dest, matchedSrcPath) {
              //   console.log(dest, matchedSrcPath)
              //   return path.join(dest, matchedSrcPath).replace('/_', '/')
              // }
            }
          ]
        }
      }
    }
    , uglify: {
      production: {
        options: {
          report: 'min'
        }
        , files: {
          'assets/main.minjs': 'assets/main.min.js'
        }
      }
    }
    , bump: {
      patch: {
        options: {
          part: 'patch'
        }
        , src: [
          'package.json'
          , 'component.json'
        ]
      }
      , minor: {
        options: {
          part: 'minor'
        }
        , src: '<%= bump.patch.src %>'
      }
      , major: {
        options: {
          part: 'major'
        }
        , src: '<%= bump.patch.src %>'
      }
    }
    , watch: {
      options: {
        livereload: 8058 //'<%= config.port + 8 %>'
        , interrupt: true
        , nospawn: true
      }
      , less: {
        files: ['less/**/*.less']
        , tasks: ['less:dev']
      }
      , js: {
        files: ['index.js', 'app/**/*.js', 'views/**/*.js', 'js/**/*.js', 'models/**/*.js', 'collections/**/*.js']
        , tasks: ['jshint', 'browserify']
      }
      , handlebars: {
        files: ['<%= handlebars.compile.files[0].cwd %><%= handlebars.compile.files[0].src[0] %>']
        , tasks: ['clean:handlebars', 'handlebars', 'browserify']
      }
    }
    , connect: {
      docs: {
        options: {
          port: '<%= config.port + 1 %>'
          , base: path.join(components, '/bootstrap/docs/_site')
          // , keepalive: true
          , middleware: function(connect, options){
            return [
              // serve .html files
              function(req, res, next){
                if (req.url === '/' || /\.(css|js|ico)$/.test(req.url)) {
                  next()
                }
                else if (fs.existsSync(path.join(__dirname, '/components/bootstrap/docs/_site/', req.url))) {
                  next()
                }
                else if (fs.existsSync(path.join(__dirname, '/components/bootstrap/docs/_site/', req.url) + '.html')) {
                  req.url = req.url + '.html'
                  next()
                }
                else if (fs.existsSync(path.join(__dirname, '/components/bootstrap/docs/_site/', req.url, '/index.html'))) {
                  req.url = path.join(req.url, '/index.html')
                  next()
                }
              }
              , connect.static(options.base)
              , connect.directory(options.base)
            ]
          }
        }
      }
      , test: {
        options: {
          port: '<%= config.port + 2 %>'
          // , keepalive: true
          , middleware: function(connect) {
            return [
              folderMount(connect, '.')
              , function(req, res) {
                var Handlebars = require('handlebars')
                  , request = require('request')
                  , specs = []
                  , template

                // TODO: match changed files against specs so that we're sure to only run necessary tests
                // console.log(grunt.regarde.changed)

                // proxy through calls to the api controller so that the test server can get data
                if (req.url.indexOf('/api') > -1) {
                  request('http://localhost:<%= config.port %>' + req.url, function(err, result, body) {
                    if (err) throw err

                    res.end(body)
                  })
                }
                // hardcoded route for the test runner
                else if (req.url === '/js-tests') {
                  grunt.file.recurse('./testClient/specs', function(abspath){
                    if (/\.js$/.test(abspath)) specs.push(abspath)
                  })

                  template = Handlebars.compile(grunt.file.read('testClient/test.hbs'))
                  res.end(template({specs: specs}))
                }
              }
            ]
          }
        }
      }
    }
    , shell: {
      bootstrapDocs: {
        command: 'command -v jekyll >/dev/null 2>&1 || { echo >&2 "You need to install jekyll"; }; jekyll'
        , options: {
          execOptions: {
            cwd: './components/bootstrap/docs/'
          }
          , stderr: false
          , failOnError: false
        }
      }
      , npmShrinkwrap: {
        command: 'npm shrinkwrap'
        , options: {
          failOnError: true
        }
      }
      , gitRequireCleanTree: {
        command: 'function require_clean_work_tree(){\n' +
          ' # Update the index\n' +
          '    git update-index -q --ignore-submodules --refresh\n' +
          '    err=0\n' +

          ' # Disallow unstaged changes in the working tree\n' +
          '    if ! git diff-files --quiet --ignore-submodules --\n' +
          '    then\n' +
          '        echo >&2 "cannot $1: you have unstaged changes."\n' +
          '        git diff-files --name-status -r --ignore-submodules -- >&2\n' +
          '        err=1\n' +
          '    fi\n' +

          ' # Disallow uncommitted changes in the index\n' +
          '    if ! git diff-index --cached --quiet HEAD --ignore-submodules --\n' +
          '    then\n' +
          '        echo >&2 "cannot $1: your index contains uncommitted changes."\n' +
          '        git diff-index --cached --name-status -r --ignore-submodules HEAD -- >&2\n' +
          '        err=1\n' +
          '    fi\n' +

          '    if [ $err = 1 ]\n' +
          '    then\n' +
          '        echo >&2 "Please commit or stash them."\n' +
          '        exit 1\n' +
          '    fi\n' +
          '} \n require_clean_work_tree'
        , options: {
          failOnError: true
        }
      }
      , gitCheckoutMaster: {
        command: 'if [ "`git branch | grep \'\\*\' | sed \'s/^\\* //\'`" != \'' + gitMasterBranch + '\' ]; then git checkout ' + gitMasterBranch + '; fi;'
        , options: {
          failOnError: true
        }
      }
      , gitSyncMaster: {
        command: 'git pull origin ' + gitMasterBranch + ' && git push origin ' + gitMasterBranch
        , options: {
          failOnError: true
        }
      }
      , gitTag: {
        command: 'git tag v<%= grunt.file.readJSON("package.json").version %>'
        , options: {
          failOnError: true
        }
      }
      , gitCommitDeployFiles: {
        command: 'git commit --amend -i package.json npm-shrinkwrap.json component.json --reuse-message HEAD'
        , options: {
          failOnError: true
        }
      }
      , gitPush: {
        command: 'git push origin ' + gitMasterBranch + ' --tags'
        , options: {
          failOnError: true
        }
      }
    }
    , mocha: {
      all: {
        options: {
          run: true
          , urls: ['http://localhost:<%= connect.test.options.port %>/js-tests']
        }
      }
    }
    , simplemocha: {
      options: {
        timeout: 2000
        , ignoreLeaks: true
        // , globals: ['chai']
        , ui: 'bdd'
        // , reporter: 'min'
      }
      , all: {
        src: ['testServer/**/*.js', '!testServer/fixtures/**']
      }
    }
    , handlebars: {
      compile: {
        options: {
          node: true
          , namespace: 'A.Templates'
          , partialRegex: /^__/
          // remove partials, since backbone will take care of that.
          , processAST: function(ast) {
            ast.statements.forEach(function(statement, i) {
              if (statement.type === 'partial') {
                ast.statements[i] = {type: 'content', string: ''}
              }
            })
            return ast
          }
          , processName: function(filename){
            return filename
              .replace(grunt.template.process('<%= handlebars.compile.files[0].cwd %>'), '')
              .replace(/\.hbs$/, '')
              .replace('/_', '/')
          }
          // , processPartialName: function(filename){
          //   var fileParts = filename.split('/')
          //     , file = fileParts.pop()
          //       .substr(1)
          //       .replace(/\.hbs$/, '')

          //   fileParts.push(file)

          //   return fileParts
          //     .join('/')
          //     .replace(grunt.template.process('<%= handlebars.compile.files[0].cwd %>'), '')
          // }
        }
        , files: [
          {
            expand: true
            , cwd: 'views/'
            , src: ['**/*.hbs']
            , dest: 'tmp/templates/'
            , ext: '.js'
            // merge partials into main files
            , rename: function(dest, src){
              var newDest = dest
                , fileParts = src.split('/')
                , filePartsLength = fileParts.length
                , file = fileParts[filePartsLength - 1]
                , ext = grunt.template.process('<%= handlebars.compile.files[0].ext %>')

              // if the file starts with a '_', it's a partial
              // if the file is index.js, should be named for it's parent directory
              // if the file
              if (file[0] === '_' || file === ('index' + ext)) {
                // the file itself is a partial, merge it
                fileParts.pop()
                // if the partial is in an subdirectory named 'index' merge it in with the other index templates
                if (fileParts[filePartsLength - 2] === 'index') fileParts.pop()
                newDest += fileParts.join('/') + ext
              }
              else newDest += fileParts.join('/')

              return newDest
            }
          }
        ]
      }
    }
    , clean: {
      handlebars: ['<%= handlebars.compile.files[0].dest %>']
    }
    , concurrent: {
      codePrep: {
        tasks: ['less:dev', 'compileJs', 'shell:bootstrapDocs']
        , options: {
          logConcurrentOutput: false
        }
      }
      , codeRun: {
        tasks: ['nodemon:server', 'watch']
        , options: {
          logConcurrentOutput: true
        }
      }
      , deployPrep: ['compileJs'
         , 'less:production'
         , 'shell:cpBootstrapFonts'
         , 'shell:cpShims'
         , 'bump:' + (grunt.option('version') || 'patch')
       ]
    }
    , nodemon: {
      server: {
        options: {
          file: 'index.js'
          , watchedFolders: ['app', 'config']
          , watchedExtensions: ['js', 'json']
          , delayTime: 0.05
        }
      }
    }
  })


  grunt.loadNpmTasks('grunt-contrib-handlebars')
  grunt.loadNpmTasks('grunt-contrib-connect')
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-simple-mocha')
  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-concurrent')
  grunt.loadNpmTasks('grunt-nodemon')
  grunt.loadNpmTasks('grunt-notify')
  grunt.loadNpmTasks('grunt-bumpx')
  grunt.loadNpmTasks('grunt-shell')

  // watch events
  ;(function(){
    var changedFiles = {}
      , onChange = grunt.util._.debounce(function() {
      grunt.config(['jshint', 'single'], Object.keys(changedFiles))
      changedFiles = {}
    }, 100)
    grunt.event.on('watch', function(action, filepath) {
      if (/\.js$/.test(filepath)) changedFiles[filepath] = action
      onChange()
    })
  })()

  // tasks that need to be run in series within grunt-concurrent
  grunt.registerTask('compileJs', 'jshint and browserify', function(){
    grunt.task.run(['jshint', 'handlebars', 'browserify'])
  })


  // setup the tasks
  grunt.registerTask('code', [
    'clean'
    , 'concurrent:codePrep'
    , 'browserify'
    , 'connect:test'
    , 'connect:docs'
    , 'concurrent:codeRun'
  ])
  grunt.registerTask('test', ['simplemocha', 'connect:test', 'mocha'])
  grunt.registerTask('predeploy', [
    'shell:gitRequireCleanTree'
    , 'shell:gitCheckoutMaster'
    , 'shell:gitRequireCleanTree'
    , 'jshint'
    , 'clean:handlebars'
    , 'clean:css'
    // , 'shell:gitSyncMaster'
    , 'less:production'
    , 'handlebars'
    , 'browserify'
    , 'uglify'
    , 'shell:killallNode' // necessary to kill the watch tasks which are using ports we need to test
    // , 'connect:test'
    // , 'mocha'
    , 'simplemocha'
    , 'bump:' + (grunt.option('version') || 'patch')
    // , 'shell:npmShrinkwrap'
    , 'shell:gitCommitDeployFiles'
    , 'shell:gitTag'
    // , 'shell:gitPush'
  ])
  grunt.registerTask('postdeploy', ['browserify', 'less:dev'])
  grunt.registerTask('docs', ['shell:bootstrapDocs', 'connect:docs'])
  // grunt.registerTask('publish', ['shell:gitRequireCleanTree', 'jshint', 'shell:npmTest', 'bump:patch', 'shell:gitCommitPackage', 'shell:gitTag', 'shell:gitPush', 'shell:npmPublish'])
}
