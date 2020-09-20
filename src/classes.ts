import * as tf from "@tensorflow/tfjs-node";

/**
 * features: [
 *  'currentRatio',
 *  'quickRatio',
 *  'operatingCashFlow' -> 'netCashflowOperating' / 'totalCurrentLiabilities',
 *  'afterTaxRoe',
 *  'returnOnAssets' -> 'netIncome' / 'totalAssets',
 *  'cashRatio',
 *  'earningsPerShare',
 *  'profitMargin'
 * ]
 */

export class NeuralNetwork {
  private _data: object[];
  private _features: string[];
  private _testSize: number;
  private _batchSize: number;

  constructor(
    data: object[],
    features: string[],
    testSize: number,
    batchSize: number
  ) {
    this._data = data;
    this._features = features;
    this._testSize = testSize;
    this._batchSize = batchSize;
  }

  private oneHot(outcome: any) {
    return Array.from(tf.oneHot(outcome, 2).dataSync());
  }

  foo() {
    console.log(this._data);
  }

  createDataSets() {
    // map all undefined feature values to –> 0
    const X = this._data.map((r: any) =>
      this._features?.map((f: any) => {
        const val = r[f];
        return val === undefined ? 0 : val;
      })
    );

    // r.Outcome needs to be changed !
    // map all outcome values from undefined to —> 0;
    const y = this._data.map((r: any) => {
      const outcome = r.Outcome === undefined ? 0 : r.Outcome;
      // oneHot will encode any value to absolute values: 0 or 1
      return this.oneHot(outcome);
    });

    // calculate the split index where the data set will be splitted;
    const splitIdx = parseInt(
      `(1 - ${this._testSize}) * ${this._data.length}`,
      10
    );

    // Zip combines the `x` and `y` Datasets into a single Dataset, the
    // iterator of which will return an object containing of two tensors,
    // corresponding to `x` and `y`.
    const ds = tf.data
      .zip({ xs: tf.data.array(X), ys: tf.data.array(y) })
      .shuffle(this._data.length, "42");

    return [
      ds.take(splitIdx).batch(this._batchSize),
      ds.skip(splitIdx + 1).batch(this._batchSize),
      tf.tensor(X.slice(splitIdx)),
      tf.tensor(y.slice(splitIdx)),
    ];
  }

  async trainLogisticRegression(
    featureCount: number,
    trainDs: any,
    validDs: any
  ) {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        units: 2,
        activation: "softmax",
        inputShape: [featureCount],
      })
    );
    const optimizer = tf.train.adam(0.001);
    model.compile({
      optimizer: optimizer,
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });
    console.log("Training...");
    await model.fitDataset(trainDs, {
      epochs: 100,
      validationData: validDs,
      callbacks: tf.node.tensorBoard('/tmp/fit_logs_1')
    });

    return model;
  }

  async run() {

  }
}
