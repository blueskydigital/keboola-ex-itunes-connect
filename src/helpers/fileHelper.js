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
