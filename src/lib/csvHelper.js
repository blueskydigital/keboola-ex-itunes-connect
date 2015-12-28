var _ = require('lodash')
var Q = require('q')
var fs = require('fs')
var csv = require('fast-csv')
var path = require('path')
var crypto = require('crypto')
var jsonfile = require('jsonfile')

var command = require('./command')
var dataDir = path.join(command.data)
var config = require('./configHelper')(dataDir)
var dataOutDir = path.join(dataDir, 'out', 'tables')

var CsvHelper = {}

// Method mergeFiles of method CsvHelper helps to read downloaded files, parse them and prepare one output that is going to be formatted later by another method (writeOutput).
CsvHelper.filterDataFiles = function(listOfDownloadedFiles) {
  var deferred = Q.defer()

  var downloadedFiles = listOfDownloadedFiles.filter(function(file){
    return _.endsWith(file, '.txt')
  })

  deferred.resolve(downloadedFiles)

  return deferred.promise
}

CsvHelper.mergeString = function(primaryKeys, data) {
  return _.map(primaryKeys, function(key) {
    return data[key]
  })
}

CsvHelper.prepareArrayOfPromises = function(listOfdataFiles) {
  var promises = []

  if (_.isArray(listOfdataFiles) && _.isEmpty(listOfdataFiles)) {
    // No data to process, exit the application.
    console.log('No data to process!')
    process.exit(0)
  }

  _.forEach(listOfdataFiles, function(fileToProcess) {
    promises.push(
      (function(tmpFileName){
        return function() {
          var deferred = Q.defer()
          const primaryKeys = config.get('parameters:primary_keys')
          const primaryKeysWithRowElement = [...primaryKeys, 'row']
          // The most important part is to have primary key defined in the configuration.
          if (_.isUndefined(primaryKeys)) {
            deferred.reject('parameters:primary_keys is not defined!')
          }

          // Keys must be also stored in an array.
          if (!_.isArray(primaryKeys)) {
            deferred.reject('parameters:primary_keys is not array!')
          }

          var itunesType = config.get('parameters:itunes_type')
          var tmpFile = fileToProcess.split('/')
          var bucketName = config.get('parameters:bucket_name') || 'in.c-itunes'
          var table = config.get('parameters:table_name') || itunesType
          var destination = bucketName + '.' + table
          var fileName =  tmpFile[tmpFile.length - 1].slice(0, -4) + '.csv'
          var manifestName = fileName + '.manifest'
          var rowNumber = 0

          var manifestString = {
            destination: destination,
            incremental: true,
            primary_key: ['id']
          }

          csv
            .fromPath(tmpFileName, { headers: true, delimiter: '\t' })
            .validate(function(data) {
              if (itunesType === 'earnings') {
                return data['Start Date'].indexOf('Total') < 0
              } else {
                return data
              }
            })
            .transform(function(data) {
              var keyArray = CsvHelper.mergeString(primaryKeys, data)
              if (_.includes(keyArray, undefined)) {
                deferred.reject("Incorrect value in 'parameters:primary_keys' array!")
              }
              else {
                data['row'] = ++rowNumber
                data['id'] = crypto.createHash('md5').update(CsvHelper.mergeString(primaryKeysWithRowElement, data).toString()).digest('hex')
              }

              return data
            })
            .pipe(csv.createWriteStream({ headers: true }))
            .pipe(fs.createWriteStream(path.join(dataOutDir, fileName), { encoding: "utf8" }))
            .on("error", function(error) {
              deferred.reject(error)
            })
            .on("finish", function(){
              jsonfile.writeFile(path.join(dataOutDir, manifestName), manifestString, function(error) {
                if (error) {
                  deferred.reject(error)
                } else {
                  deferred.resolve('File: ' + fileName + ' parsed successfully!')
                }
              })
            });

          return deferred.promise
        }
      })(fileToProcess)
    )
  })

  return promises
}


module.exports = CsvHelper