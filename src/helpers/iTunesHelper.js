import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { capitalize, flatten } from 'lodash';
import { Sales, Finance } from 'itc-reporter';
import {
  END_TYPE,
  ERROR_TYPE,
  RESPONSE_TYPE,
  DATASET_EMPTY,
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
 * This function generates the parameters required for downloading of the reports
 */
export function generateDownloadParameters({ vendors, dates, reportSubType, dateType, reportType }) {
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
    .map(file => extractReports(file.compressedFileName, file.fileName));
}

/**
 * This function helps to download particular report based on the options object
 */
export function getReport(reporter, options, outputDirectory) {
  return new Promise((resolve, reject) => {
    const readingStream = reporter.getReport(options);
    const fileName = path.join(outputDirectory, `${options.vendorNumber}_${options.date}.txt`);
    const compressedFileName = `${fileName}.gz`;
    const writingStream = fs.createWriteStream(compressedFileName);
    readingStream.on(RESPONSE_TYPE, response => {
      if (response.statusCode === 200) {
        resolve({ state: DATASET_DOWNLOADED, fileName, compressedFileName });
      } else if (response.statusCode === 404) {
        resolve({ state: DATASET_EMPTY, fileName, compressedFileName });
      } else {
        reject(`Problem with data download of ${fileName}, error: ${response.statusCode}`);
      }
    });
    readingStream.pipe(writingStream);
  });
}

/**
 * This function extracts the gzipped files and get the actual text files
 */
export function extractReports(sourceFile, destinationFile) {
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const readStream = fs.createReadStream(sourceFile);
    const writeStream = fs.createWriteStream(destinationFile);
    readStream
    readStream
      .pipe(gunzip)
      .pipe(writeStream)
        .on(ERROR_TYPE, error => reject(error))
        .on(END_TYPE, () => resolve(destinationFile));
  });
}
