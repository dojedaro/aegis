import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { appConfig } from "../config.js";

export const ROLES = ["admin", "analyst", "viewer"] as const;
export type Role = (typeof ROLES)[number];

/** The claims a token must carry. Validated on every request, never just cast. */
const AuthUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().min(1),
  role: z.enum(ROLES),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}

export const TOKEN_TTL = "24h";

export function signToken(user: AuthUser & { name?: string }): string {
  return jwt.sign(user, appConfig.jwtSecret, { expiresIn: TOKEN_TTL, algorithm: "HS256" });
}

/** Returns the user for a valid, unexpired token whose claims match the schema; otherwise null. */
export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, appConfig.jwtSecret, { algorithms: ["HS256"] });
    const parsed = AuthUserSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
}

/** Attaches req.user when a valid token is present; never rejects the request. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  const user = token ? verifyToken(token) : null;
  if (user) req.user = user;
  next();
}

/** Rejects the request with 401 unless it carries a valid token. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.user = user;
  next();
}

/** Role-based access control; use after requireAuth. */
export function requireRole(...roles: Role[]) {
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
