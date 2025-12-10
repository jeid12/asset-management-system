// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt.util";
import { tokenBlacklist } from "../utils/tokenBlacklist.util";

export interface AuthRequest extends Request {
  user?: JwtPayload;
  token?: string;
  sessionId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Check if token is blacklisted (logged out)
    if (tokenBlacklist.isBlacklisted(token)) {
      res.status(401).json({ message: "Token has been revoked. Please login again." });
      return;
    }

    // Get sessionId from header if available
    const sessionId = req.headers['x-session-id'] as string;
    if (sessionId) {
      req.sessionId = sessionId;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      return;
    }

    next();
  };
};
