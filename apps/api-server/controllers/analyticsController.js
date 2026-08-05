const dashboardInsightService = require("../services/dashboardInsightService");

const getDashboardInsight = async (req, res, next) => {
  try {
    const result = await dashboardInsightService.getDashboardInsight(req.user);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardInsight
};
