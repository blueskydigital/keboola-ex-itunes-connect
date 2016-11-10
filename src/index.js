import path from 'path';
import rimraf from 'rimraf-promise';
import command from './helpers/cliHelper';
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
  parseConfiguration,
  createManifestFile
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
  getDownloadedReports,
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
      endDate,
      fileName,
      password,
      dateType,
      startDate,
      reportType,
      reportSubType
    } = await parseConfiguration(getConfig(path.join(command.data, CONFIG_FILE)));
    // Prepares table out directory where the files are going to be stored.
    console.log(`Downloading data between ${startDate} and ${endDate}!`);
    const downloadDir = await createTmpDirectory();
    const tableOutDir = path.join(command.data, DEFAULT_TABLES_OUT_DIR);
    const reporter = iTunesConnectInit({ userId, password, mode, reportType });
    const options = generateReportParams({
      vendors, regions, periods, dates, dateType, reportType, reportSubType
    });
    const reports = await Promise.all(downloadReports(reporter, options, downloadDir));
    // We should read the content of the directory where the downloaded files are stored.
    const compressedFiles = await readFilesFromDirectory(downloadDir);
    const files = getDownloadedReports(
      await Promise.all(uncompressReportFiles(downloadDir, compressedFiles))
    );
    // Check whether the input files exist (if some data was downloaded + written into the files).
    if (size(files) > 0) {
      const transferedFiles = await transferFilesFromSourceToDestination(downloadDir, tableOutDir, files, fileName, reportType, getKeysBasedOnReportType(reportType));
      // Create final manifest.
      const manifest = await createManifestFile(
        `${path.join(tableOutDir, fileName)}.manifest`,
        { incremental: IS_INCREMENTAL, primary_key: PRIMARY_KEY }
      );
    }
    // Cleaning.
    // const cleaning = await rimraf(downloadDir);
    console.log('Extraction completed!');
    process.exit(0);
  } catch(error) {
    console.error(error);
    process.exit(1);
  }
})();
