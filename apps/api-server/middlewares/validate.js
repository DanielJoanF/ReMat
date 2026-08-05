/**
 * Simple request body validation helper.
 * @param {string[]} requiredFields - Array of required field names
 */
const validateRequired = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: {
          message: `Missing required fields: ${missing.join(", ")}`,
          statusCode: 400
        }
      });
    }
    next();
  };
};

module.exports = { validateRequired };
