import path from 'path';
import rimraf from 'rimraf-promise';
import command from './helpers/cliHelper';
import Promise from 'bluebird';
import {
  size,
  capitalize
} from 'lodash';
import {
  createTmpDirectory,
  readFilesFromDirectory
} from './helpers/fileHelper';
import {
  getConfig,
  generateManifests,
  parseConfiguration
} from './helpers/keboolaHelper';
import {
  PRIMARY_KEY,
  CONFIG_FILE,
  IS_INCREMENTAL,
  DATASET_DOWNLOADED,
  DEFAULT_TABLES_IN_DIR,
  DEFAULT_TABLES_OUT_DIR
} from './constants';
import {
  extractReports,
  downloadReports,
  iTunesConnectInit,
  generateReportParams,
  uncompressReportFiles,
  getKeysBasedOnReportType,
  transferFilesFromSourceToDestination
} from './helpers/iTunesHelper';

/**
 * This is the main part of the program.
 */
(async() => {
  try {
    console.log('Start: ');
    // Reading of the input configuration.
    const {
      mode,
      dates,
      userId,
      regions,
      periods,
      vendors,
      password,
      dateType,
      reportType,
      reportSubType
    } = await parseConfiguration(getConfig(path.join(command.data, CONFIG_FILE)));
    const manifestData = { destination: reportType, incremental: IS_INCREMENTAL, primary_key: PRIMARY_KEY };
    // Prepares table out directory where the files are going to be stored.
    const tmpDir = await createTmpDirectory();
    const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);
    const reporter = iTunesConnectInit({ userId, password, mode, reportType });
    const options = generateReportParams({ vendors, regions, periods, dates, dateType, reportType, reportSubType });
    console.log('Options prepared: ', options);
    const compressedFiles = await Promise.all(downloadReports(reporter, options, tmpDir));
    console.log('Compressed files: ', compressedFiles);
    const files = await Promise.all(uncompressReportFiles(compressedFiles, DATASET_DOWNLOADED));
    console.log('Files: ', files);
    // Check whether the input files exist (if some data was downloaded + written into the files).
    if (size(files) > 0) {
      const transferedFiles = await transferFilesFromSourceToDestination(tmpDir, tableOutDir, files, reportType, getKeysBasedOnReportType(reportType));
      console.log('Transfered files: ', transferedFiles);
      // We need to generate the manifests for the output files.
      const downloadedFiles = await readFilesFromDirectory(tableOutDir);
      console.log('Downloaded files: ', downloadedFiles);
      const manifests = await Promise.all(generateManifests(tableOutDir, downloadedFiles, manifestData));
      console.log('Manifests: ', manifests);
      console.log(`${size(manifests)} file(s) downloaded!`);
    }
    // Cleaning
    const cleaning = await rimraf(tmpDir);
    console.log('Download process completed!');
    process.exit(0);
  } catch(error) {
    console.error(error);
    process.exit(1);
  }
})();
