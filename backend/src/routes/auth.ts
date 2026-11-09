import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { randomUUID } from "crypto";
import { run } from "../db/schema.js";
import { appConfig } from "../config.js";
import { AuthUser, TOKEN_TTL, requireAuth, signToken } from "../middleware/auth.js";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type Role = AuthUser["role"];

// Fictional demo accounts for "The Safe Company" (documented in the README).
// Demo-only: a real deployment would delegate to an identity provider instead of in-code credentials.
const DEMO_USERS: Record<string, { password: string; role: Role; name: string }> = {
  "admin@safeco.com": { password: "admin123", role: "admin", name: "Admin User" },
  "analyst@safeco.com": { password: "analyst123", role: "analyst", name: "Compliance Analyst" },
  "viewer@safeco.com": { password: "viewer123", role: "viewer", name: "Audit Viewer" },
  "demo@safeco.com": { password: "demo", role: "analyst", name: "Demo User" },
};

const REFRESH_GRACE_SECONDS = 7 * 24 * 60 * 60;

export function createAuthRouter(): Router {
  const router = Router();

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Login and get access token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *           example:
   *             email: "demo@safeco.com"
   *             password: "demo"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       401:
   *         description: Invalid credentials
   */
  router.post("/login", (req, res) => {
    const data = LoginSchema.parse(req.body);

    const account = DEMO_USERS[data.email];
    if (!account || account.password !== data.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = { id: `user-${data.email.split("@")[0]}`, email: data.email, role: account.role, name: account.name };

    run(
      `INSERT INTO audit_entries (id, timestamp, actor, action, resource, risk_level, compliance_relevant) VALUES (?, ?, ?, 'auth_login', 'auth', 'low', 0)`,
      [randomUUID(), new Date().toISOString(), data.email]
    );

    res.json({ token: signToken(user), user, expiresIn: TOKEN_TTL });
  });

  /**
   * @swagger
   * /api/auth/demo-token:
   *   post:
   *     summary: Get a read-only demo token for exploring the API
   *     description: Issues a `viewer` token. Use /api/auth/login with an analyst account for write access.
   *     tags: [Auth]
   *     responses:
   *       200:
   *         description: Demo token generated
   */
  router.post("/demo-token", (req, res) => {
    // Viewer only: an anonymous endpoint must not hand out write permissions.
    const user = { id: "demo-viewer", email: "viewer@safeco.com", role: "viewer" as const, name: "Demo Viewer" };
    res.json({ token: signToken(user), user, expiresIn: TOKEN_TTL });
  });

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Get current user info
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user details
   *       401:
   *         description: Not authenticated
   */
  router.get("/me", requireAuth, (req, res) => {
    res.json({ user: req.user });
  });

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     summary: Refresh access token
   *     description: Accepts a valid token, or one that expired less than 7 days ago.
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: New token generated
   *       401:
   *         description: Invalid or expired token
   */
  router.post("/refresh", (req, res) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    let decoded: AuthUser & { name?: string; exp: number };
    try {
      decoded = jwt.verify(header.slice(7), appConfig.jwtSecret, {
        algorithms: ["HS256"],
        ignoreExpiration: true,
      }) as typeof decoded;
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (decoded.exp < Math.floor(Date.now() / 1000) - REFRESH_GRACE_SECONDS) {
      return res.status(401).json({ error: "Token too old to refresh" });
    }

    const { id, email, role, name } = decoded;
    res.json({ token: signToken({ id, email, role, name }), expiresIn: TOKEN_TTL });
  });

  return router;
}
