import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Middleware to check if user has required role(s)
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const userRole = authReq.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions.' 
      });
    }

    return next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('admin');
