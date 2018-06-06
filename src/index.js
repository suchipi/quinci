/* @flow */
import type { NormalizedConfig } from "./normalize-config";

const http = require("http");
const debug = require("debug")("quinci:http");
const createHandler = require("./create-handler");

module.exports = function runQuinCI(config: NormalizedConfig): Promise<void> {
  const handler = createHandler(config);

  return new Promise((resolve) => {
    const server = http.createServer(function(req, res) {
      try {
        handler(req, res, (err) => {
          res.statusCode = 400;
          res.end("400 Bad Request");
        });
      } catch (err) {
        debug(
          "Error in HTTP request handler: " + (err && err.stack)
            ? err.stack
            : err
        );
        res.statusCode = 500;
        res.end("500 Internal Server Error");
      }
    });

    server.listen(config.port, resolve);
  });
};
