const http = require("http");
const createHandler = require("./create-handler");

module.exports = function runDumbCI(config) {
  const handler = createHandler(config);

  return new Promise(resolve => {
    const server = http.createServer(function(req, res) {
      handler(req, res, err => {
        res.statusCode = 404;
        res.end("404 Not Found");
      });
    });

    server.listen(config.port, resolve);
  });
};
