/* @flow */
const path = require("path");
const express = require("express");
const statusPage = require("./routes/status-page");
const cancelJob = require("./routes/cancel-job");

const app = express();

app.get("/", statusPage);
app.get("/cancel", cancelJob);
app.use("/assets", express.static(path.join(__dirname, "assets")));

module.exports = app;
