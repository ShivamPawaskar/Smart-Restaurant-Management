import { query } from "../config/db.js";
import { verifyToken } from "../services/authService.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    const rows = await query("SELECT id, role, session_id FROM users WHERE id = ?", [payload.sub]);
    if (!rows.length) {
      return res.status(401).json({ message: "User not found" });
    }

    const user = rows[0];
    if (!user.session_id || user.session_id !== payload.sessionId) {
      return res.status(401).json({ message: "Session expired. Please login again." });
    }

    req.user = {
      id: user.id,
      role: user.role,
      sessionId: user.session_id
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient permissions" });
  }
  return next();
};
