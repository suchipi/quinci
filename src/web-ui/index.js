/* @flow */
const express = require("express");
const statusPage = require("./routes/status-page");
const cancelJob = require("./routes/cancel-job");

const app = express();

app.get("/", statusPage);
app.get("/cancel", cancelJob);

module.exports = app;
