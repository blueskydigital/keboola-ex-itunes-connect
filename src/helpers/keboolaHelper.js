'use strict';
import nconf from 'nconf';
import {
  isEmpty,
  isArray,
  includes,
  isUndefined
} from 'lodash';
import {
  DATE_TYPE,
  REPORT_MODE,
  MOMENT_PERIOD,
  REPORT_SUB_TYPE,
  REPORT_SALES_TYPE,
  DEFAULT_DATE_MASK,
  REPORT_FINANCIAL_TYPE
} from '../constants';
import twix from 'twix';
import moment from 'moment';
import isThere from 'is-there';


/**
 * This function simply reads the config and parse the input JSON object.
 * If requested file doesn't exist, program stop running.
 */
export function getConfig(configPath) {
  if (isThere(configPath)) {
    return nconf.env().file(configPath);
  } else {
    console.error('No configuration specified!');
    process.exit(1);
  }
}

/**
 * This function gets dateFrom and dateTo and generates array of dates
 * which contains all dates within that interval.
 */
function generateDateArray(dateFrom, dateTo) {
  const outputArray = [];
  const range = moment(dateFrom, DEFAULT_DATE_MASK)
    .twix(moment(dateTo, DEFAULT_DATE_MASK))
    .iterate(MOMENT_PERIOD);
  while(range.hasNext()) {
    outputArray.push(moment(range.next()._d).format(DEFAULT_DATE_MASK));
  }
  return outputArray;
}

/**
 * This is a simple helper that checks whether the input configuration is valid.
 * If so, the particular object with relevant parameters is returned.
 * Otherwise, an error is thrown.
 */
export function parseConfiguration(configObject) {
  return new Promise((resolve, reject) => {
    // Read username.
    const userId = configObject.get('parameters:#username');
    if (!userId) {
      reject('Parameter #username is not defined! Please check out the documentation for more information.');
    }
    // Read password.
    const password = configObject.get('parameters:#password');
    if (!password) {
      reject('Parameter #password is not defined! Please check out the documentation for more information.');
    }
    // React reportType information.
    const reportType = configObject.get('parameters:reportType');
    if (!reportType) {
      reject('Parameter reportType is not defined! Please check out the documentation for more information.');
    }
    // Read array of vendors ids.
    const vendors = configObject.get('parameters:vendors');
    if (!vendors) {
      reject('Parameter vendors is not defined! Please check out the documentation for more information.');
    }
    if (!isArray(vendors)) {
      reject('Parameter vendors must be an array including vendors (even when there is just one)! Please check out the documentation for more information.');
    }
    if (isEmpty(vendors)) {
      reject('Empty array of vendors! Please check out the documentation for more information.');
    }

    // Compare whether the reportType is either REPORT_SALES_TYPE or REPORT_FINANCIAL_TYPE.
    if (!includes([ REPORT_SALES_TYPE, REPORT_FINANCIAL_TYPE ], reportType.toLowerCase())) {
      reject(`Parameter reportType has invalid value. Please specify either ${REPORT_SALES_TYPE} or ${REPORT_FINANCIAL_TYPE}!`);
    }

    // Another important step is to set the date range properly.
    const maximalDate = moment.utc().subtract(1, MOMENT_PERIOD).format(DEFAULT_DATE_MASK);
    const defaultStartDate = moment.utc().subtract(30, MOMENT_PERIOD).format(DEFAULT_DATE_MASK);
    const startDate = isUndefined(configObject.get('parameters:startDate')) || isEmpty(configObject.get('parameters:startDate'))
      ? defaultStartDate
      : configObject.get('parameters:startDate');
    const endDate = isUndefined(configObject.get('parameters:endDate')) || isEmpty(configObject.get('parameters:endDate'))
      ? maximalDate
      : configObject.get('parameters:endDate');
    // Verify whether the format of the startDate and endDate is correct.
    if (moment(startDate)._f !== DEFAULT_DATE_MASK) {
      reject(`Invalid date mask set for parameter 'startDate'. Please set the value to ${DEFAULT_DATE_MASK}`);
    }
    if (moment(endDate)._f !== DEFAULT_DATE_MASK) {
      reject(`Invalid date mask set for parameter 'endDate'. Please set the value to ${DEFAULT_DATE_MASK}`);
    }
    // Verify whether an input date are inserted in proper order.
    if (moment(endDate, DEFAULT_DATE_MASK).diff(moment(startDate, DEFAULT_DATE_MASK)) <= 0) {
      reject(`Parameter endDate ${endDate} is older than or equal to startDate ${startDate}! Please check out the documentation for more information.`);
    }
    // Verify whether endDate is not older than today() - 1.
    if (moment(endDate, DEFAULT_DATE_MASK).diff(maximalDate) > 0) {
      reject(`Parameter endDate ${endDate} is bigger than maximal allowed date value ${maximalDate}! Please check out the documentation for more information.`);
    }
    // This generates the array of dates.
    const dates = generateDateArray(startDate, endDate);

    resolve({
      dates,
      userId,
      vendors,
      password,
      mode: REPORT_MODE,
      dateType: DATE_TYPE,
      reportSubType: REPORT_SUB_TYPE,
      reportType: reportType.toLowerCase()
    });
  });
}
