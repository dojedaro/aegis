import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { run, get } from "../db/schema.js";
import { randomUUID } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "aegis-demo-secret-change-in-production";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Demo users (in production, this would be a database with hashed passwords)
const DEMO_USERS: Record<string, { password: string; role: "admin" | "analyst" | "viewer"; name: string }> = {
  "admin@safeco.com": { password: "admin123", role: "admin", name: "Admin User" },
  "analyst@safeco.com": { password: "analyst123", role: "analyst", name: "Compliance Analyst" },
  "viewer@safeco.com": { password: "viewer123", role: "viewer", name: "Audit Viewer" },
  "demo@safeco.com": { password: "demo", role: "analyst", name: "Demo User" },
};

export function createAuthRouter(): Router {
  const router = Router();

  // POST /api/auth/login - Get access token
  router.post("/login", (req, res) => {
    try {
      const data = LoginSchema.parse(req.body);

      const user = DEMO_USERS[data.email];
      if (!user || user.password !== data.password) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const payload = {
        id: `user-${data.email.split("@")[0]}`,
        email: data.email,
        role: user.role,
        name: user.name,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

      // Log authentication
      run(
        `INSERT INTO audit_entries (id, timestamp, actor, action, resource, risk_level, compliance_relevant) VALUES (?, ?, ?, 'auth_login', 'auth', 'low', 0)`,
        [randomUUID(), new Date().toISOString(), data.email]
      );

      res.json({
        token,
        user: {
          id: payload.id,
          email: data.email,
          name: user.name,
          role: user.role,
        },
        expiresIn: "24h",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        throw error;
      }
    }
  });

  // POST /api/auth/demo-token - Get a demo token (for testing)
  router.post("/demo-token", (req, res) => {
    const payload = {
      id: "demo-user-1",
      email: "demo@safeco.com",
      role: "analyst" as const,
      name: "Demo User",
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      token,
      user: payload,
      expiresIn: "24h",
      note: "This is a demo token for testing. In production, use /api/auth/login.",
    });
  });

  // GET /api/auth/me - Get current user info
  router.get("/me", (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    try {
      const user = jwt.verify(token, JWT_SECRET);
      res.json({ user });
    } catch {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  });

  // POST /api/auth/refresh - Refresh token
  router.post("/refresh", (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as {
        id: string;
        email: string;
        role: string;
        name: string;
        iat: number;
        exp: number;
      };

      // Only allow refresh within 7 days of expiry
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp < now - 7 * 24 * 60 * 60) {
        return res.status(401).json({ error: "Token too old to refresh" });
      }

      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({ token: newToken, expiresIn: "24h" });
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  return router;
}
