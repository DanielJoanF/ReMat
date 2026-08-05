const config = require("@remat/config");

const getHealthStatus = (req, res) => {
  res.status(200).json({
    status: "ok",
    app: config.APP_NAME,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
};

module.exports = {
  getHealthStatus
};
