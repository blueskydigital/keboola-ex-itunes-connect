var path = require('path')
var nconf = require('nconf')
var isThere = require('is-there')

module.exports = function(dataDir) {
  var configJson = 'config.json'
  var config = nconf.env()

  if (isThere(path.join(dataDir, configJson))) {
    config.file(path.join(dataDir, configJson))
  } else {
    console.error('No config specified!')
    process.exit(1)
  }

  return config
}