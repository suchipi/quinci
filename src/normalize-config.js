module.exports = function normalizeConfig(config) {
  return {
    appId: config.appId,
    appCert: config.appCert,
    webhookSecretFile: config.webhookSecretFile,
    port: config.port,
  };
};
