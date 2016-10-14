import path from 'path';
import rimraf from 'rimraf-promise';
import command from './helpers/cliHelper';
import {
  SALES_KEYS,
  CONFIG_FILE,
  REPORT_MODE,
  DATASET_DOWNLOADED,
  DEFAULT_TABLES_IN_DIR,
  DEFAULT_TABLES_OUT_DIR
} from './constants';
import { capitalize } from 'lodash';
import {
  createTmpDirectory
} from './helpers/fileHelper';
import {
  getConfig,
  parseConfiguration
} from './helpers/keboolaHelper';
import {
  extractReports,
  downloadReports,
  iTunesConnectInit,
  uncompressReportFiles,
  generateDownloadParameters,
  transformFilesByAddingPrimaryKey
} from './helpers/iTunesHelper';

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
    const tmpDir = await createTmpDirectory();
    const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);
    const reporter = iTunesConnectInit({ userId, password, mode, reportType });
    const options = generateDownloadParameters({ vendors, dates, reportSubType, dateType, reportType: capitalize(reportType)});
    const compressedFiles = await Promise.all(downloadReports(reporter, options, tmpDir));
    const files = await Promise.all(uncompressReportFiles(compressedFiles, DATASET_DOWNLOADED));
    // Check whether the input files exist (if some data was downloaded + written into the files).
    const test = await transformFilesByAddingPrimaryKey(tableOutDir, tmpDir, '85674928_20161012.txt', SALES_KEYS);

    // Cleaning
    const cleaning = await rimraf(tmpDir);
    console.log('Download completed');
    process.exit(0);
  } catch(error) {
    console.error(error);
    process.exit(1);
  }
})();
