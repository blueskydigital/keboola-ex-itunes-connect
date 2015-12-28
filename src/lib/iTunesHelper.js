var _ = require('lodash')
var Q = require('q')
var fs = require('fs')
var path = require('path')
var moment = require('moment')
var iTunesDownloader = require("apple-autoingestion")

var command = require('./command')
var csvHelper = require('./csvHelper')
var configHelper = require('./configHelper')
var dateHelper = require('./dateHelper')
var fiscalCalendarGenerator = require('./fiscalDimensionGenerator')

var ITunesHelper = {}
var dataDir = path.join(command.data)
var config = require('./configHelper')(dataDir)

var defaultDate = moment().subtract(2, 'days').format('YYYYMMDD')
var initialDate = config.get('parameters:date_from') || defaultDate
var maximumDate = config.get('parameters:date_to') || defaultDate


// This method helps to generate fiscal calendars based on array containing fiscal years.
ITunesHelper.getFiscalCalendarForITunes = function(fiscalYears) {
  return _.map(fiscalYears, function(fiscalYear) {
    var settings = { 'month': 9, 'year': fiscalYear }
    return fiscalCalendarGenerator.generateCalendarForSpecifiedSettings(settings)
  })
}

// This method helps to generate list of fiscal periods for further processing.
ITunesHelper.periodsList = function(currentYear, nextYear) {
  var fiscalCalendar = this.getFiscalCalendarForITunes([currentYear, nextYear])

  return dateHelper.getDatesForReportsDownload(initialDate, maximumDate).map(function(date, index) {
    return _.flattenDeep(_.map(fiscalCalendar, function(yearArray, yearIndex) {
      return _.map(yearArray, function(periodArray, periodIndex) {
        return _.includes(periodArray, date) ? [[currentYear, nextYear][yearIndex] + '-' + periodIndex] : []
      })
    }))
  })
}

// Return previous period
ITunesHelper.alignPeriod = function(period) {
  var periodArray = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  if (_.isUndefined(period)) {
    console.error('No period specified!')
    process.exit(1)
  }

  var yearInteger = parseInt(period.split('-')[0])
  var periodId = period.split('-')[1]

  var year = (parseInt(periodId) === 0) ? yearInteger - 1 : yearInteger
  var period = periodArray[periodId]

  return { year: year, period: period }
}

ITunesHelper.dateHandling = function(iTunesType) {
  // We need to check whether there is itunes_type equals either earnings or sales.
  // Earnings must be handled by fiscal periods calendar, sales by traditional one.
  if (iTunesType === 'earnings') {
    // It is better to generate also 1 year ahead to make sure we will always have complete periods
    var currentYear = moment().format("YYYY")
    var nextYear = moment().add(1, 'years').format("YYYY")

    return _.uniq(_.flatten(this.periodsList(currentYear, nextYear)))
  } else if (iTunesType === 'sales') {
    // Simply getting an interval of dates.
    return dateHelper.getDatesForReportsDownload(initialDate, maximumDate)
  } else {
    console.error('Incorrect itunes_type type!');
    process.exit(1)
  }
}

ITunesHelper.prepareSalesObjects = function(downloadDate, vendor, iTunesType, reportType, grain, tmpDirectory) {
  var deferred = Q.defer()

  // Initialize of object for data downloading.
  var autoIngestion = iTunesDownloader.AutoIngestion({
    username: config.get('parameters:#username'),
    password: config.get('parameters:#password'),
    vendorId: vendor
  })

  autoIngestion.downloadSalesReport(grain, iTunesType, reportType, downloadDate, tmpDirectory, function(error, filePath) {
    // Distinguish between two types of error - if just no data is available, print the message to the console.
    // Otherwise stop the execution by calling callback(error).
    if (error) {
      if (error.toString().indexOf("no report") >= 0) {
        var message = "No sales data for " + vendor + ", in " + downloadDate + "!"
        deferred.resolve(message)
      } else {
        deferred.reject(error)
      }
    } else {
      deferred.resolve(filePath)
    }
  })

  return deferred.promise
}

ITunesHelper.prepareEarningsObjects = function(period, vendor, region, tmpDirectory) {
  var deferred = Q.defer()

  // Initialize of object for data downloading.
  var autoIngestion = iTunesDownloader.AutoIngestion({
    username: config.get('parameters:#username'),
    password: config.get('parameters:#password'),
    vendorId: vendor
  })

  var dateObject = ITunesHelper.alignPeriod(period)
  var year = dateObject.year
  var month = dateObject.period

  autoIngestion.downloadEarningsReport(region, year, month, tmpDirectory, function(error, filePath) {
    // Distinguish between two types of error - if just no data is available, print the message to the console.
    // Otherwise stop the execution by calling callback(error).
    if (error) {
      if (error.toString().indexOf("no report") >= 0) {
        var message = "No data for " + region + ", in " + year + "/" + month + "!"
        deferred.resolve(message)
      } else {
        deferred.reject(error)
      }
    } else {
      deferred.resolve(filePath)
    }
  })

  return deferred.promise
}

ITunesHelper.prepareArrayOfPromises = function(tmpDirectory) {
  var promises = [];

  // We need to check input params whether they are defined.
  var iTunesType = config.get('parameters:itunes_type')
  var vendorId = config.get('parameters:vendor_id')
  var regions = config.get('parameters:regions')
  var salesGrain = config.get('parameters:sales_grain') || 'daily'
  var salesReportType = config.get('parameters:sales_report_type') || 'summary'

  if (_.isUndefined(iTunesType)) {
    console.error("Parameter 'itunes_type' is not defined!");
    process.exit(1)
  }

  if (_.isUndefined(vendorId) || !_.isArray(vendorId)) {
    console.error("Parameter 'vendor_id' is either missing or is not defined properly! There must be an array containing a list of vendors you want to get data from!")
    process.exit(1)
  }

  if (iTunesType === 'earnings') {
    // We must check whether the parameter array was properly checked.
    if (_.isUndefined(regions) || !_.isArray(regions)) {
      console.error("Parameter 'regions' is either missing or is not defined properly! There must be an array containing a list of regions you want to get data from!")
      process.exit(1)
    }

    var listOfPeriods = this.dateHandling(iTunesType)
    _.forEach(listOfPeriods, function(period) {
      _.forEach(vendorId, function(vendor) {
          // Iterate over regions and run the download process for each of them.
          _.forEach(regions, function(region) {
            promises.push(
              (function(currentPeriod, currentVendor, currentRegion){
                return function() {
                  return ITunesHelper.prepareEarningsObjects(currentPeriod, currentVendor, currentRegion, tmpDirectory)
                }
              })(period, vendor, region)
            )
          })
        })
    })
  } else if (iTunesType === 'sales') {
    var listOfDates = this.dateHandling(iTunesType)
    _.forEach(listOfDates, function(date) {
      _.forEach(vendorId, function(vendor) {
        promises.push(
          (function(downloadDate, vendor, iTunesType, reportType, grain) {
            return function() {
              return ITunesHelper.prepareSalesObjects(downloadDate, vendor, iTunesType, reportType, grain, tmpDirectory)
            }
          })(date, vendor, iTunesType, salesReportType, salesGrain)
        )
      })
    })
  } else {
    console.error("Parameter 'itunes_type' contains an invalid value!")
    process.exit(1)
  }

  return promises
}

ITunesHelper.processArrayOfPromises = function(arrayOfPromises) {
  var results = arrayOfPromises.map(function(promise) {
    return promise()
  })

  return Q.all(results)
}


module.exports = ITunesHelper