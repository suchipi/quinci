#!/usr/bin/env node
/* @flow */
const argv = require("yargs")
  .option("port", {
    describe: "Port to run the HTTP server on",
    default: 7777,
  })
  .option("app-id", {
    describe: "GitHub App ID",
  })
  .option("app-cert", {
    describe: "Path to the GitHub App's private key pem file",
  })
  .option("webhook-secret-file", {
    describe: "Path to a text file containing your Webhook secret",
  })
  .option("queue-concurrency", {
    describe:
      "How many instances of a job are allowed to run at once. Use 'Infinity' for no limit.",
    default: "master=1,main=1,pull-request=3",
  })
  .option("web-url", {
    describe: "URL at which the web UI can be accessed",
  })
  .option("named-branches", {
    describe:
      "Comma-separated list of branch names that have corresponding jobs in the 'quinci' folder in the repo root, that should be run when commits are pushed to that branch.",
    default: "master,main",
  })
  .demandOption([
    "port",
    "app-id",
    "app-cert",
    "webhook-secret-file",
    "web-url",
  ]).argv;

const debug = require("debug")("quinci:cli");
const normalizeConfig = require("./normalize-config");
const runQuinCI = require("./index");

const config = normalizeConfig(argv);

debug("Config: " + JSON.stringify(config, null, 2));

runQuinCI(config).then(() => {
  const version = require("../package.json").version;
  console.log(`quinCI ${version} is running`);
});
