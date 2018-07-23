/* @flow */
export type InputConfig = {
  appId: number,
  appCert: string,
  webhookSecretFile: string,
  port: number,
  queueConcurrency: ?(string | { [taskName: string]: number }),
};

export type NormalizedConfig = {|
  appId: number,
  appCert: string,
  webhookSecretFile: string,
  port: number,
  queueConcurrency: { [taskName: string]: number },
|};

function invalidFormatError() {
  return new Error(
    "Invalid queue concurrency string format. Valid format is eg. master=1,pull-request=3"
  );
}

const defaultQueueConcurrency = {
  master: 1,
  "pull-request": 3,
};

function parseQueueConcurrencyString(configStr: string) {
  let queueConcurrencyObject = { ...defaultQueueConcurrency };

  if (configStr) {
    try {
      configStr.split(",").forEach((entry) => {
        const [taskName, concurrency] = entry.split("=");
        let parsedConcurrency;
        if (concurrency === "Infinity") {
          parsedConcurrency = Infinity;
        } else {
          parsedConcurrency = parseInt(concurrency);
        }
        if (Number.isNaN(parsedConcurrency)) {
          throw invalidFormatError();
        } else {
          queueConcurrencyObject[taskName] = parsedConcurrency;
        }
      });
    } catch (err) {
      throw invalidFormatError();
    }
  }

  return queueConcurrencyObject;
}

module.exports = function normalizeConfig(
  config: InputConfig
): NormalizedConfig {
  let queueConcurrency = defaultQueueConcurrency;
  if (typeof config.queueConcurrency === "string") {
    queueConcurrency = parseQueueConcurrencyString(config.queueConcurrency);
  } else if (
    typeof config.queueConcurrency === "object" &&
    config.queueConcurrency != null
  ) {
    queueConcurrency = config.queueConcurrency;
  }

  return {
    appId: config.appId,
    appCert: config.appCert,
    webhookSecretFile: config.webhookSecretFile,
    port: config.port,
    queueConcurrency,
  };
};
