const circularReportService = require("../services/circularReportService");

const generateReport = async (req, res, next) => {
  try {
    const { distributorId, period } = req.body;

    if (!period) {
      return res.status(400).json({
        error: { message: "Parameter 'period' (format YYYY-MM) is required.", statusCode: 400 }
      });
    }

    if (distributorId) {
      const report = await circularReportService.generateReportForDistributor(distributorId, period);
      return res.status(201).json({ data: report, message: `Circular report for period ${period} generated successfully.` });
    }

    // Trigger for all distributors
    const summary = await circularReportService.generateAllReportsForPeriod(period);
    res.status(201).json({ data: summary, message: `Bulk report generation for period ${period} completed.` });
  } catch (err) {
    next(err);
  }
};

const listMyReports = async (req, res, next) => {
  try {
    const reports = await circularReportService.listDistributorReports(req.user.id);
    res.json({ data: reports });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate a circular report for the authenticated distributor's own profile.
 * Resolves the distributor profile from the logged-in user (tenant-scoped);
 * the client must NOT pass distributorId so a user can't generate for others.
 */
const generateMyReport = async (req, res, next) => {
  try {
    const { period } = req.body;

    if (!period) {
      return res.status(400).json({
        error: { message: "Parameter 'period' (format YYYY-MM) is required.", statusCode: 400 }
      });
    }

    const report = await circularReportService.generateReportForCurrentUser(req.user.id, period);
    return res.status(201).json({ data: report, message: `Circular report for period ${period} generated successfully.` });
  } catch (err) {
    next(err);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await circularReportService.getReportById(req.params.id, req.user);
    res.json({ data: report });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateReport,
  generateMyReport,
  listMyReports,
  getReportById
};
