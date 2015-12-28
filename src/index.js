var _ = require('lodash')
var os = require('os')
var fs = require('fs')
var path = require('path')
var temp = require('temp')
var rimraf = require('rimraf')

var dataTempDir = temp.path()

var iTunesHelper = require('./lib/iTunesHelper')
var csvHelper = require('./lib/csvHelper')
var arrayOfPromises = iTunesHelper.prepareArrayOfPromises(dataTempDir)

iTunesHelper.processArrayOfPromises(arrayOfPromises)
  .then(csvHelper.filterDataFiles)
  .then(csvHelper.prepareArrayOfPromises)
  .then(iTunesHelper.processArrayOfPromises)
  .then(function(message) {
    // first of all, we need to clear our tmp storage
    // Remove the tmp directory recursively.
    rimraf(dataTempDir, function(error) {
      if (error) {
        console.error(error)
        process.exit(1)
      }
      // Everything is all right, log the message and quit the script.
      console.log(message)
      process.exit(0)
    })
  })
  .catch(function(runtimeError) {
    // first of all, we need to clear our tmp storage
    // Remove the tmp directory recursively.
    rimraf(dataTempDir, function(error) {
      if (error) {
        console.error('Problem with cleaning of the /tmp folder. Please restart the application!')
        process.exit(1)
      }
      // There was an issue, we need to log the information to KBC + exit the script with ERROR state.
      console.error(runtimeError)
      process.exit(1)
    }) 
  })
