import moment from 'moment';
import {
  first,
  range,
  flatten,
  includes,
  flattenDeep
} from 'lodash';
import {
  INITIAL_PERIOD,
  DEFAULT_DATE_MASK
} from '../constants';
import {
  generateDateArray
} from './keboolaHelper';

/**
 * This function generates days in a fiscal month.
 */
export function daysInMonth(year, month) {
  return 32 - (new Date(year, month, 32).getDate());
}

/**
 * This function checks whether a certain year is a leap one.
 */
export function isLeapYear(year) {
  return ((52 * (year + 3) + 146) % 293) < 52;
}

/**
 * This function gets week start dates by periods.
 */
export function getWeekStartDatesByPeriods(periodDates) {
  return periodDates
    .map(date => {
      return moment
        .utc(date)
        .subtract(7, 'day')
        .unix();
    });
}

/**
 * This function populates the whole weeks by dates.
 */
export function populateWeeksByDates(periodArray) {
  return periodArray.map(epoch => {
    return range(0, 7).map(day => {
      return moment(epoch, "X")
        .add(day, 'days')
        .format(DEFAULT_DATE_MASK);
    });
  });
}

/**
 * This function build whole weeks within fiscal periods.
 */
export function buildWeek(year, month, day) {
  const daysInCurrentMonth = daysInMonth(year, month);
  let zeroOffset = 0;
  let dayOfWeek;

  for (let i = 0, j = 7; i < j; i+= 1) {
    dayOfWeek = ((i + day) % (daysInCurrentMonth + 1));
    if (dayOfWeek === 0) {
      zeroOffset += 1;
      if (month + 1 > 11) {
        month = 0;
        year += 1;
      } else {
        month += 1;
      }
    }
  }

  return [ year, month, (dayOfWeek + zeroOffset + 1) ];
}

/**
 * This function calculates the fiscal weeks.
 */
export function fiscalWeeks(year, month, day, weekCount) {
  const weeksInPeriod = [];
  let week = buildWeek(year, month, day);
  weeksInPeriod.push(week);

  for (let i = 0, j = weekCount - 1; i < j; i += 1) {
    week = buildWeek(week[0], week[1], week[2]);
    weeksInPeriod.push(week);
  }

  return weeksInPeriod;
}

/**
 * This function generates the whole fiscal calendar.
 */
export function generateFiscalCalendar({ year, month }) {
  const result = [];
  const previousYear = year - 1;
  const firstDayOfMonth = (new Date(previousYear, month)).getDay();
  const firstWeekOfLastMonth = daysInMonth(previousYear, month);
  const day = firstWeekOfLastMonth - firstDayOfMonth;
  let weekCount = 5;
  let fiscalMonth;

  for (let j = 0, quarters = 4; j < quarters; j += 1) {
    for (let k = 0, weeks = 3; k < weeks; k += 1) {
      weekCount = k === 0 ? 5 : 4;
      if (k === 2 && j === 0 && isLeapYear(year)) {
        weekCount = 5;
      }
      if (j === 0 && k === 0) {
        fiscalMonth = fiscalWeeks(previousYear, Math.abs((month - 1) % 12), day, weekCount);
        result.push(fiscalMonth);
      } else {
        const element = fiscalMonth[fiscalMonth.length - 1];
        fiscalMonth = fiscalWeeks(element[0], element[1], element[2], weekCount)
        result.push(fiscalMonth);
      }
    }
  }

  return buildCalendar(result);
}

/**
 * This function builds the calendar.
 */
export function buildCalendar(fiscalArray) {
  return fiscalArray.map(period => {
    return flatten(populateWeeksByDates(getWeekStartDatesByPeriods(period)));
  });
}

/**
 * This function prepares the periods related to the fiscal dates.
 */
export function periodsList(currentYear, nextYear, dates) {
  const fiscalCalendar = getFiscalCalendar([currentYear, nextYear]);
  return dates.map((date, index) => {
    return flattenDeep(fiscalCalendar.map((yearArray, yearIndex) => {
      return yearArray.map((periodArray, periodIndex) => {
        return includes(periodArray, date)
          ? [[ currentYear, nextYear ][ yearIndex ] + '-' + periodIndex ]
          : [];
      })
    }))
  })
}

/**
 * This function get the fiscal calendar.
 */
export function getFiscalCalendar(fiscalYears) {
  return fiscalYears.map(year => {
    return generateFiscalCalendar({ year, month: INITIAL_PERIOD });
  });
}

/**
 * This function reads the generated period and align it for better processing.
 */
export function alignPeriod(inputPeriod) {
  const periodArray = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const yearInteger = parseInt(first(inputPeriod.split('-')));
  const periodId = inputPeriod.split('-')[1];
  const year = (parseInt(periodId) === 0)
    ? yearInteger - 1
    : yearInteger;
  const period = periodArray[ periodId ];
  return { year, period };
}
