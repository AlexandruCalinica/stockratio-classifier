import * as papa from "papaparse";

/**custom utils */
export const pipe = (...fns: any) => (data: any) =>
  fns.reduce((prev: any, curr: any) => curr(prev), data);

export const parsePromise = function (file: any) {
  return new Promise(function (complete, error) {
    papa.parse(file, {
      header: true,
      download: true,
      dynamicTyping: true,
      worker: true,
      complete,
      error,
    });
  });
};