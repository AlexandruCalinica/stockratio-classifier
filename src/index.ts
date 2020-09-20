import express from "express";

import { Parser } from "./parser";
import { fixIndex, mergeFromSecurities, filterNull } from "./procedures";

import * as securities from "./data/json/securities.json";

// partially applied
const prop = 'currentRatio';
const fundamentalsPath = "/data/csv/fundamentals.csv"
const _filterNull = filterNull(prop);
const _mergeFromSecurities = mergeFromSecurities(securities.data);

const app = express();

const parser = Parser()
  .loadCsv(fundamentalsPath)
  .toJson([fixIndex, _filterNull, _mergeFromSecurities])
  .then((data) => data?.extractAverages(prop).save("averages.json"))
  .catch((e) => console.log(e));

app.get("/", (req, res) => {
  res.send({
    message: "hello world",
  });
});

app.listen(3001, () => {
  console.log("server started");
});
