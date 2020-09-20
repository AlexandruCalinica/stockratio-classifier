import fs from "fs";
import { pipe, parsePromise } from "./utils";
import { makeAverage } from "./procedures";

/**interfaces */
interface ParserInstance {
  __typeclass: string;
  value(): any;
  save(filename: string): ParserInstance;
  loadCsv(path: string): ParserInstance;
  extractAverages(ratioProp: string): ParserInstance;
  toJson(
    callbacks?: { (data: object): object }[] | { (data: object): object }
  ): Promise<ParserInstance | undefined>;
  mutate(
    callbacks?: { (data: object): object }[] | { (data: object): object }
  ): ParserInstance;
}
interface ParserProps {
  (v?: any): ParserInstance;
}

/**typeclass */
export const Parser: ParserProps = (v?: any) => ({
  __typeclass: "Parser",
  value: () => v,
  extractAverages: (ratioProp: string) =>
  _extractAverages(Parser(v), ratioProp),
  loadCsv: (path: string) => _loadCsv(path),
  save: (filename: string) => _save(Parser(v), filename),
  toJson: (
    callbacks?: { (data: object): object }[] | { (data: object): object }
  ) => _toJson(Parser(v), callbacks),
  mutate: (
    callbacks?: { (data: object): object }[] | { (data: object): object }
  ) => _mutate(Parser(v), callbacks),
});

/**private methods */

/**
 * Loads a file as a ReadStream
 * @param string _path - ex: '/data/prices-split-adjusted.csv'
 */
const _loadCsv = (_path: string) =>
  Parser(fs.createReadStream(__dirname + _path));

/**
 * Parses a CSV file to JSON format and saves it to the root level folder.
 * Optionaly invokes a single callback function or a set of callback functions to modify the output JSON data.
 * @param _instance - current Parser instance.
 * @param callbacks - array of callbacks | single callback
 */
const _toJson = async (_instance: ParserInstance, callbacks?: any) => {
  const csv = _instance.value();
  try {
    const values: any = await parsePromise(csv);
    const json = await values.data;

    if (Array.isArray(callbacks) && callbacks.length > 0) {
      const parsed: any = await pipe(...callbacks)(json);
      return Parser(parsed);
    }
    if (callbacks && callbacks instanceof Function) {
      const parsed: any = await callbacks(json);
      return Parser(parsed);
    }
    return Parser(json);
  } catch (e) {
    console.log(e);
  }
};

/**
 * Save the current Parser _instance.value() to a <filename>.json file at the root level directory.
 * @param _instance - current Parser instance.
 * @param _filename - name to be used for saving the .json file
 */
const _save = (_instance: ParserInstance, _filename: string) => {
  fs.writeFile(_filename, JSON.stringify(_instance.value()), "utf8", () =>
    console.log("file saved successfully.")
  );
  return _instance;
};

/**
 * Extract all average ratio values and order it by gicsSubIndustry & dateEnding
 * REQUIRED: 'gicsSubIndustry' must exist as a property on every iterated object.
 * HINT: make sure to pass mergeFromSecurities() as a callback for  Parser.toJson()
 * which usually is called after  Parser.loadCsv();
 * @param fundamentals - combined-fundamentals object
 * @param ratioProp - prop used for extracting the average values
 */
const _extractAverages = (_instance: ParserInstance, ratioProp: string) => {
  let result: any = {};
  const values = _instance.value();
  values.forEach((o: any) => {
    result[o.gicsSubIndustry] = {
      ...result[o.gicsSubIndustry],
      [o.periodEnding]: makeAverage(
        values,
        ratioProp,
        o.gicsSubIndustry,
        o.periodEnding
      ),
    };
  });
  return Parser(result);
};

/**
 * Alter any json data according to callbacks arguments.
 * @param _instance - current Parser instance.
 * @param callbacks - array of callbacks | single callback
 */
const _mutate = (_instance: ParserInstance, callbacks?: any) => {
  const json = _instance.value();
  if (Array.isArray(callbacks) && callbacks.length > 0) {
    return Parser(pipe(...callbacks)(json));
  }
  return Parser(callbacks(json));
};
