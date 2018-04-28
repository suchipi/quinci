#!/usr/bin/env node
const argv = require("yargs")
  .option("port", {
    describe: "Port to run the HTTP server on",
    default: 7777,
  })
  .option("appId", {
    describe: "GitHub App ID",
  })
  .option("appCert", {
    describe: "Path to the GitHub App's private key pem file",
  })
  .option("webhookSecretFile", {
    describe: "Path to a text file containing your Webhook secret",
  })
  .demandOption(["port", "appId", "appCert", "webhookSecretFile"]).argv;

const debug = require("debug")("quinci:cli");
const normalizeConfig = require("./normalize-config");
const runDumbCI = require("./index");

const config = normalizeConfig(argv);

debug("Config: " + JSON.stringify(config, null, 2));

runDumbCI(config).then(() => {
  console.log("QuinCI is running");
});
