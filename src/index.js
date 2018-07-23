/* @flow */
import type { NormalizedConfig } from "./normalize-config";

const http = require("http");
const AppContext = require("./app-context");
const createHttpMiddleware = require("./create-http-middleware");

module.exports = function runQuinCI(config: NormalizedConfig): Promise<void> {
  const appContext = new AppContext(config);
  const httpMiddleware = createHttpMiddleware(appContext);

  return new Promise((resolve) => {
    const server = http.createServer(httpMiddleware);
    server.listen(config.port, resolve);
  });
};
