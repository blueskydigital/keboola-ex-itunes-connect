'use strict';
import fs from 'fs';
import tmp from 'tmp';
import csv from 'fast-csv';
import path from 'path';
import isThere from 'is-there';
import {
  END_TYPE,
  DATA_TYPE,
  ERROR_TYPE,
  FINISH_TYPE
} from '../constants';

/**
 * This function creates a temp directory where the files are going to be downloaded.
 */
export function createTmpDirectory() {
  return new Promise((resolve, reject) => {
    tmp.dir((error, path, cleanupCallback) => {
      if (error) {
        reject(error);
      } else {
        resolve(path);
      }
    });
  });
}

/**
 * This function reads files from specified.
 */
export function readFilesFromDirectory(filesDirectory) {
  return new Promise((resolve, reject) => {
    fs.readdir(filesDirectory, (error, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}

/**
 * This function reads the source files and merge them into single one.
 */
export function mergeDownloadedFiles(sourceDirectory, inputFiles) {
  return inputFiles.map(file => generateOutputFile(sourceDirectory, file));
}

/**
 * This function simple read file and store content into a new one which is going to be uploaded into Keboola.
 */
export function generateOutputFile(sourceDir, sourceFile) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(path.join(sourceDir, sourceFile));
    let output = '';
    csv
     .fromStream(readStream, { headers: true })
     .on(DATA_TYPE, data => output = data )
     .on(ERROR_TYPE, error => reject(error))
     .on(END_TYPE, () => {
       resolve(output);
     });
  });
}

/**
 * This function just stores data to selected destination.
 * Data is appending to a file, the first one needs to have a header.
 */
export function createOutputFile(fileName, data) {
  return new Promise((resolve, reject) => {
    csv
      .writeToStream(fs.createWriteStream(fileName), data, { headers: true })
      .on(ERROR_TYPE, () => reject('Problem with writing data into output!'))
      .on(FINISH_TYPE, () => resolve(fileName));
  });
}

/**
 * This function iterates over tmp files and remove them.
 */
export function removeTmpFiles(sourceDirectory, files) {
  return files.map(file => {
    return removeFile(path.join(sourceDirectory, file));
  });
}

/**
 * This function remove a single file.
 */
export function removeFile(file) {
  return new Promise((resolve, reject) => {
    fs.unlink(file, error => {
      if (error) {
        reject(error);
      } else {
        resolve(`${file} deleted successfully!`);
      }
    })
  });
}
