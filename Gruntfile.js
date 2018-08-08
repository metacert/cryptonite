module.exports = function(grunt) {

  grunt.initConfig({
    jsdoc : {
        dist : {
            src: ['src/**/*.js'],
            options: {
                destination: 'output/doc',
                template: "node_modules/ink-docstrap/template",
                configure: "node_modules/ink-docstrap/template/jsdoc.conf.json"
            }
        }
    },

    jslint: { // configure the task
      // lint your project's client code
      client: {
        src: [
          'src/js/**/*.js'
        ],
        exclude: [
          'src/js/lib/*.*'
        ],
        directives: {
          predef: [
            'module',
            'require',
            'jQuery',
            '$',
            'self',
            'chrome',
            'MetaCertApi',
            'Background',
            'ConfigSettings',
            'Cryptonite',
            'Options',
            'Popup',
            'CryptoniteUtils',
            'PropertyDAO'
          ],
          "bitwise": false,
          "browser": true,
          "eval": false,
          "evil": false,
          "getset": true,
          "long": true,
          "maxerr": 5000,
          "multivar": false,
          "nomen": true,
          "passfail": false,
          "plusplus": true,
          "regexp": true,
          "single": true,
          "sloppy": true,
          "todo": true,
          "this": true,
          "undef": false,
          "vars": true,
          "white": true
        },
        options: {
          errorsOnly: false,
          failOnError: false,
          log: 'output/grunt-jslint-results.log'
        }
      }
    },

    exec: {
      jslint: {
        cmd: function(outputToConsole) {
          var resultsFile = 'output/jslint-results.log';
          var filesToExamine = 'src/js/background/api/metacertApi.js src/js/background/background.js src/js/background/configSettings.js src/js/contentScript/cryptonite.js src/js/options/options.js src/js/popup/popup.js src/js/utils/cryptoniteUtils.js src/js/utils/propertyDAO.js';
          var outputCommand = '';

          if (outputToConsole) {
            outputCommand = ' --color true';
          } else {
            outputCommand = ' > ' + resultsFile;
          }

          var commandToExecute = [
            'rm -rfd ' + resultsFile,
            'jslint ' + filesToExamine + outputCommand
          ].join('&&');

          return commandToExecute;
        },
        exitCode: [0,1]
      }
    }
  });

  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-jslint');

  grunt.registerTask("cryptonite-jslint", "Execute a jslint scan over the whole codebase", function() {
    var outputToConsole = grunt.option('c') || '';
    grunt.task.run("exec:jslint:" + outputToConsole);
  });

  grunt.registerTask('default', ['jsdoc', 'jslint', 'exec:jslint']);
};
