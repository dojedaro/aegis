import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "aegis-demo-secret-change-in-production";

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Generate a demo token for testing
export function generateDemoToken(): string {
  const payload: AuthUser = {
    id: "demo-user-1",
    email: "demo@safeco.com",
    role: "analyst",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

// Auth middleware - optional authentication
// If token is provided and valid, attaches user to request
// If no token or invalid, continues but req.user is undefined
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

// Auth middleware - required authentication
// Returns 401 if no valid token
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const token = authHeader.substring(7);
  const user = verifyToken(token);

  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = user;
  next();
}

// Role-based access control
export function requireRole(...roles: Array<"admin" | "analyst" | "viewer">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}
