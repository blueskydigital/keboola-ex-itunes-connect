import path from 'path';
import command from './helpers/cliHelper';
import { Sales, Finance } from 'itc-reporter';
import {
  CONFIG_FILE,
  REPORT_MODE,
  DATASET_DOWNLOADED,
  DEFAULT_TABLES_OUT_DIR
} from './constants';
import { capitalize } from 'lodash';
import {
  extractReports,
  downloadReports,
  iTunesConnectInit,
  uncompressReportFiles,
  generateDownloadParameters
} from './helpers/iTunesHelper';
import {
  getConfig,
  parseConfiguration
} from './helpers/keboolaHelper';

/**
 * This is the main part of the program.
 */
(async() => {
  try {
    // Reading of the input configuration.
    const {
      mode,
      dates,
      userId,
      vendors,
      password,
      dateType,
      reportType,
      reportSubType
    } = await parseConfiguration(getConfig(path.join(command.data, CONFIG_FILE)));
    // Prepares table out directory where the files are going to be stored.
    const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);
    const reporter = iTunesConnectInit({ userId, password, mode, reportType });


    const options = generateDownloadParameters({ vendors, dates, reportSubType, dateType, reportType: capitalize(reportType)});
    const compressedFiles = await Promise.all(downloadReports(reporter, options, tableOutDir));
    const files = await Promise.all(uncompressReportFiles(compressedFiles, DATASET_DOWNLOADED));

    console.log(files);
    process.exit(0);
  } catch(error) {
    console.error(error);
    process.exit(1);
  }
})();
