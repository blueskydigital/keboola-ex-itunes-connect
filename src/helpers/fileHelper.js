import tmp from 'tmp';

/**
 * This function creates a temp directory where the files are going to be downloaded
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
