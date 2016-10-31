import fs from 'fs';
import csv from 'fast-csv';
import zlib from 'zlib';
import path from 'path';
import crypto from 'crypto';
import Promise from 'bluebird';
import {
  size,
  flatten,
  includes,
  camelCase,
  capitalize
} from 'lodash';
import {
  Sales,
  Finance
} from 'itc-reporter';
import {
  generateOutputName
} from './keboolaHelper';
import {
  alignPeriod
} from './fiscalCalendarHelper';
import {
  END_TYPE,
  DATA_TYPE,
  ENOTFOUND,
  ECONNRESET,
  ERROR_TYPE,
  SALES_KEYS,
  RESPONSE_TYPE,
  DATASET_EMPTY,
  EARNINGS_KEYS,
  CONNECTION_ERROR,
  REPORT_SALES_TYPE,
  DATASET_DOWNLOADED,
  REPORT_FINANCIAL_TYPE
} from '../constants';

/**
 * This function creates the iTunes Connect instance.
 */
export function iTunesConnectInit({ userId, password, mode, reportType }) {
  if (reportType === REPORT_SALES_TYPE) {
    return new Sales({ userId, password, mode });
  } else if (reportType === REPORT_FINANCIAL_TYPE) {
    return new Finance({ userId, password, mode });
  }
}

/**
 * This function creates params based on the report type.
 */
export function generateReportParams({ vendors, regions, periods, dates, dateType, reportType, reportSubType }) {
  if (reportType === REPORT_SALES_TYPE) {
    return generateSalesReportParameters({ vendors, dates, reportSubType, dateType, reportType: capitalize(reportType) });
  } else if (reportType === REPORT_FINANCIAL_TYPE) {
    return generateFinancialReportParameters({ vendors, periods, regions, reportType: capitalize(reportType) });
  }
}

/**
 * This function generates the right keys based on the report type.
 */
export function getKeysBasedOnReportType(reportType) {
  if (reportType === REPORT_SALES_TYPE) {
    return SALES_KEYS;
  } else if (reportType === REPORT_FINANCIAL_TYPE) {
    return EARNINGS_KEYS;
  }
}

/**
 * This function generates the parameters required for downloading the sales reports.
 */
export function generateSalesReportParameters({ vendors, dates, reportSubType, dateType, reportType }) {
  return flatten(dates
    .reduce((previous, current) => {
      return [...previous, vendors
        .map(vendor => {
          return {
            dateType,
            reportType,
            reportSubType,
            date: current,
            vendorNumber: vendor
          }
        })];
    }, []));
}

/**
 * This function generates the parameters required for downloading the financial reports.
 */
export function generateFinancialReportParameters({ vendors, periods, regions, reportType }) {
  return flatten(periods
    .reduce((previous, current) => {
      return [...previous, addPeriodIntoParamsObject(vendors, current, regions, reportType)];
    }, []));
};

/**
 * This function adds period into desired params.
 */
export function addPeriodIntoParamsObject(vendors, period, regions, reportType) {
  return flatten(vendors
    .reduce((previous, current) => {
      return [...previous, regions
        .map(regionCode => {
          const { fiscalYear, fiscalPeriod } = alignPeriod(period);
          return {
            reportType,
            regionCode,
            fiscalYear,
            fiscalPeriod,
            vendorNumber: current
          }
        })
      ];
    }, []));
}

/**
 * This function reads the input parameters and generate download promises.
 */
export function downloadReports(reporter, options, outputDirectory) {
  return options
    .map(params => getReport(reporter, params, outputDirectory));
}

/**
 * This function reads the downloaded files,
 * filter out the ones which don't contain any data
 * and extract the rest of them.
 */
export function uncompressReportFiles(files, state) {
  return files
    .filter(file => file.state === state)
    .map(file => {
      return extractReports(file.compressedFileName, file.file, file.fileName);
    });
}

/**
 * This function helps to download particular report based on the options object
 */
export function getReport(reporter, options, outputDirectory) {
  return new Promise((resolve, reject) => {
    const readingStream = reporter.getReport(options);
    const fileName = generateOutputName(options);
    const file = path.join(outputDirectory, fileName);
    const compressedFileName = `${file}.gz`;
    const writingStream = fs.createWriteStream(compressedFileName);
    readingStream.on(RESPONSE_TYPE, response => {
      if (response.headers.exitcode && parseInt(response.headers.exitcode) === 1) {
        resolve({ state: DATASET_EMPTY, file, fileName, compressedFileName });
      } else if (response.statusCode === 200) {
        resolve({ state: DATASET_DOWNLOADED, file, fileName, compressedFileName });
      } else if (response.statusCode === 401 || response.statusCode === 404) {
        resolve({ state: DATASET_EMPTY, file, fileName, compressedFileName });
      } else {
        reject(`Problem with data download of ${fileName}, error: ${response.statusCode}`);
      }
    });
    readingStream.on(ENOTFOUND, () => reject(CONNECTION_ERROR));
    readingStream.on(ECONNRESET, () => reject(CONNECTION_ERROR));
    readingStream.pipe(writingStream);
  });
}

/**
 * This function extracts the gzipped files and get the actual text files
 */
export function extractReports(sourceFile, destinationFile, fileName) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(sourceFile);
    const writeStream = fs.createWriteStream(destinationFile);
    readStream
      .on(ERROR_TYPE, error => reject(error))
      .on(END_TYPE, () => {
        console.log(`${fileName} downloaded!`);
        resolve(fileName)
      })
      .pipe(zlib.createGunzip())
      .pipe(writeStream);
  });
}

/**
 * This function reads files in source directory and transfer them into destination directory.
 * It also adds some primary key information.
 */
export function transferFilesFromSourceToDestination(sourceDir, destinationDir, files, reportType, keyArray) {
  return files.map(file => {
    return transformFilesByAddingPrimaryKey(sourceDir, destinationDir, file, reportType, keyArray);
  });
}

/**
 * This function update files, add hash which is going to be a primary key and store the file in the new location
 */
export function transformFilesByAddingPrimaryKey(sourceDir, destinationDir, fileName, reportType, keyArray) {
  return new Promise((resolve, reject) => {
    let counter = 0;
    const csvStream = csv.createWriteStream({ headers: true });
    const readStream = fs.createReadStream(path.join(sourceDir, fileName));
    const writeStream = fs.createWriteStream(path.join(destinationDir, fileName), { encoding: "utf8" });
    csv
      .fromStream(readStream, { headers: true, delimiter: '\t' })
      .validate(data => {
        if (reportType.toLowerCase() === REPORT_FINANCIAL_TYPE) {
          return data['startDate'].indexOf('Total') < 0;
        } else {
          return data;
        }
      })
      .transform(obj => {
        counter++
        return combineDataWithKeys(obj, keyArray, counter);
      })
      .on(ERROR_TYPE, error => reject(error))
      .on(END_TYPE, () => {
        resolve(fileName)
      })
      .pipe(csvStream)
      .pipe(writeStream);
  });
}

/**
 * This function combines the data with the keys.
 */
export function combineDataWithKeys(data, keys, counter) {
  return Object.keys(data)
    .reduce((previous, current) => {
      return Object.assign(previous, { [ camelCase(current) ]: data[ current ].trim() });
    }, { id: generatePrimaryKey( data, keys, counter ) });
}

/**
 * This function generates hash based on the data and specified keys.
 */
export function generatePrimaryKey(data, keys, counter) {
  const keyObject = Object.keys(data)
    .reduce((previous, current) => {
      if (includes(keys, current)) {
        return { id: `${previous['id']} ${data[current]}` };
      } else {
        return previous;
      }
    }, { id: counter });
  return crypto.createHash('md5').update(keyObject.id).digest('hex');
}
