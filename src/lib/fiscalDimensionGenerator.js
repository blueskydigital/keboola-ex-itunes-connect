// A simple helper for generating 5-4-4 fiscal dimensions for handling the Apple Earning Reports.
//
// Return a complete calendar for particular year.

var _ = require('lodash')
var moment = require('moment')

var FiscalDimensionGenerator = {}

FiscalDimensionGenerator.generateCalendarForSpecifiedSettings = function(inputSettings) {
  return (function(settings){
    var daysInMonth = function(year, month){
      return 32 - (new Date(year, month, 32).getDate())
    }

    var isLeapYear = function(year){
      var offset = 3
      return ((52 * (year + offset) + 146) % 293) < 52
    }

    var getWeekStartDatesByPeriods = function(periodDates) {
      return _.map(periodDates, function(date) {
        return moment.utc(date).subtract(7, 'day').unix()
      })
    }

    var populateWeeksByDates = function(periodArray) {
      return _.map(periodArray, function(epoch) {
        return _.map(_.range(0, 7), function(day) {
          return moment(epoch, "X").add(day, 'days').format("YYYYMMDD")
        })
      })
    }

    var buildWeek = function(year, month, day) {
      var daysInCurrentMonth = daysInMonth(year, month)
      var zeroOffset = 0
      var dayOfWeek

      for(var i = 0, j = 7; i < j; i += 1) {
        dayOfWeek = ((i + day) % (daysInCurrentMonth + 1))
        if(dayOfWeek === 0) {
          zeroOffset += 1
          if (month + 1 > 11) {
            month = 0
            year += 1
          } else {
            month += 1
          }
        }
      }
      return [year, month, (dayOfWeek + zeroOffset + 1)]
    };

    var fiscalWeeks = function(year, month, day, weekCount) {
      var weeksInPeriod = []

      var week = buildWeek(year, month, day)
      weeksInPeriod.push(week)

      for (var i = 0, j = weekCount - 1; i < j; i += 1) {
        week = buildWeek(week[0], week[1], week[2])
        weeksInPeriod.push(week)
      }

      return weeksInPeriod
    }


    var buildCalendar = function(fiscalArray) {
      return _.map(fiscalArray, function(period, index) {
        return _.flatten(populateWeeksByDates(getWeekStartDatesByPeriods(period)))
      });
    }

    var isLeapYear = isLeapYear(settings.year)
    var firstDayOfMonth = (new Date(settings.year - 1, settings.month)).getDay()
    var firstWeekOfLastMonth = daysInMonth(settings.year - 1,settings.month)
    var year = settings.year - 1
    var month = Math.abs((settings.month - 1) % 12)
    var day = firstWeekOfLastMonth - firstDayOfMonth
    var weekCount = 5
    var result = []
    var fiscalMonth

    for(var j = 0, quarters = 4; j < quarters; j += 1) {
      for(k = 0, weeks = 3; k < weeks; k += 1) {
        weekCount = k === 0 ? 5 : 4

        if(k === 2 && j === 0 && isLeapYear) {
          weekCount = 5
        }

        if(j === 0 && k === 0) {
          fiscalMonth = fiscalWeeks(year, month, day, weekCount)
          result.push(fiscalMonth)
        } else {
          var element = fiscalMonth[fiscalMonth.length - 1]
          fiscalMonth = fiscalWeeks(element[0], element[1], element[2], weekCount)
          result.push(fiscalMonth)
        }
      }
    }

    return buildCalendar(result)
  })(inputSettings)
}

module.exports = FiscalDimensionGenerator