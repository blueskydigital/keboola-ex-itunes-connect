import path from 'path';
import rimraf from 'rimraf-promise';
import command from './helpers/cliHelper';
import {
  size,
  capitalize
} from 'lodash';
import {
  removeTmpFiles,
  createTmpDirectory,
  mergeDownloadedFiles,
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
    // Reading of the input configuration.
    const {
      mode,
      dates,
      userId,
      regions,
      periods,
      vendors,
      fileName,
      password,
      dateType,
      reportType,
      reportSubType
    } = await parseConfiguration(getConfig(path.join(command.data, CONFIG_FILE)));
    // Prepares table out directory where the files are going to be stored.
    const downloadDir = await createTmpDirectory();
    const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);
    const reporter = iTunesConnectInit({ userId, password, mode, reportType });
    const options = generateReportParams({ vendors, regions, periods, dates, dateType, reportType, reportSubType });
    const compressedFiles = await Promise.all(downloadReports(reporter, options, downloadDir));
    const files = await Promise.all(uncompressReportFiles(compressedFiles, DATASET_DOWNLOADED));
    // Check whether the input files exist (if some data was downloaded + written into the files).
    if (size(files) > 0) {
      const transferedFiles = await transferFilesFromSourceToDestination(downloadDir, tableOutDir, files, fileName, reportType, getKeysBasedOnReportType(reportType));
      // We need to generate the manifests for the output files.
      const downloadedFiles = await readFilesFromDirectory(tableOutDir);
      // Merge files into singe one.
      const merged = await mergeDownloadedFiles(tableOutDir, downloadedFiles, fileName);
      // Remove tmp files.
      const removed = await removeTmpFiles(tableOutDir, downloadedFiles);
      // Create final manifest.
      const manifestData = { incremental: IS_INCREMENTAL, primary_key: PRIMARY_KEY };
      const manifests = await Promise.all(generateManifests(tableOutDir, [ fileName ], manifestData));
    }
    // Cleaning.
    const cleaning = await rimraf(downloadDir);
    console.log('Data downloaded!');
    process.exit(0);
  } catch(error) {
    console.error(error);
    process.exit(1);
  }
})();
