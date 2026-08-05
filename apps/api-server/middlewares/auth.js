/**
 * Auth middleware stubs for ReMat API.
 * Reads x-user-id and x-user-role headers to simulate authenticated user context.
 * Will be replaced with real Supabase JWT verification in the Auth phase.
 */

/**
 * Attaches user info from headers to req.user (does NOT reject unauthenticated).
 */
const attachUser = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  const userRole = req.headers["x-user-role"];

  if (userId && userRole) {
    req.user = { id: userId, role: userRole.toUpperCase() };
  } else {
    req.user = null;
  }
  next();
};

/**
 * Rejects request if no user identity is present.
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: { message: "Authentication required", statusCode: 401 } });
  }
  next();
};

/**
 * Rejects request if user role is not in the allowed list.
 * @param  {...string} roles - Allowed roles (e.g. "ADMIN", "DISTRIBUTOR")
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { message: "Authentication required", statusCode: 401 } });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: { message: "Insufficient permissions", statusCode: 403 } });
    }
    next();
  };
};

module.exports = { attachUser, requireAuth, requireRole };
