const alertService = require("../services/alertService");

const createAlert = async (req, res, next) => {
  try {
    const alert = await alertService.createAlert(req.user.id, req.body);
    res.status(201).json({ data: alert, message: "Alert created. You will be notified when matching material is available." });
  } catch (err) {
    next(err);
  }
};

const listMyAlerts = async (req, res, next) => {
  try {
    const alerts = await alertService.listMyAlerts(req.user.id);
    res.json({ data: alerts });
  } catch (err) {
    next(err);
  }
};

const deactivateAlert = async (req, res, next) => {
  try {
    const alert = await alertService.deactivateAlert(req.params.id, req.user.id);
    res.json({ data: alert, message: "Alert deactivated" });
  } catch (err) {
    next(err);
  }
};

module.exports = { createAlert, listMyAlerts, deactivateAlert };
