const http = require("http");
const createHandler = require("./create-handler");

module.exports = function runQuinCI(config) {
  const handler = createHandler(config);

  return new Promise((resolve) => {
    const server = http.createServer(function(req, res) {
      try {
        handler(req, res, (err) => {
          res.statusCode = 400;
          res.end("400 Bad Request");
        });
      } catch (err) {
        res.statusCode = 400;
        res.end("400 Bad Request");
      }
    });

    server.listen(config.port, resolve);
  });
};
