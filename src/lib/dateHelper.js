var twix = require('twix')
var moment = require('moment')

var DateHelper = {}

// A small helper - method getDatesForReportsDownload of object DateHelper.
// If no iTunesDateFrom and iTunesDateTo are specified, used a default date for both (iTunesDateFrom === iTunesDateTo).
// Returns array of dates.

// Input params:
// -- iTunesDateFrom: date that download starts downloading from.
// -- iTunesDateTo: date that download starts downloading to.

DateHelper.getDatesForReportsDownload = function(iTunesDateFrom, iTunesDateTo) {
  var outputArray = []
  var dateFrom = moment(iTunesDateFrom, "YYYYMMDD")
  var dateTo = moment(iTunesDateTo, "YYYYMMDD")

  if (dateFrom.isSame(dateTo)) {
    var resultDate = moment(iTunesDateFrom, "YYYYMMDD")
    outputArray.push(resultDate._i.toString())

    return outputArray
  }
  else {
    var dateDiff = dateFrom.isBefore(dateTo) ? moment(dateFrom).twix(dateTo) : moment(dateTo).twix(dateFrom)
    var range = dateDiff.iterate("days")

    while(range.hasNext()) {
      outputArray.push(moment(range.next()._d).format("YYYYMMDD"))
    }

    return outputArray
  }
}

module.exports = DateHelper