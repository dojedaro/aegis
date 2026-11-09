import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { buildTestApp, bearer } from "../helpers.js";
import { query } from "../../src/db/schema.js";
import { csvCell } from "../../src/routes/audit.js";

describe("Security", () => {
  let app: express.Express;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  describe("SQL injection (regression)", () => {
    // These query strings used to be interpolated straight into SQL.
    const payloads = ["x' OR '1'='1", "completed' UNION SELECT * FROM audit_entries --", "'; DROP TABLE credentials; --"];

    it.each(payloads)("rejects %s on list endpoints", async (payload) => {
      for (const path of ["/api/compliance", "/api/risk", "/api/credentials"]) {
        const param = path === "/api/risk" ? "level" : "status";
        const res = await request(app).get(path).query({ [param]: payload });
        expect(res.status, path).toBe(400);
      }
    });

    it("binds free-text filters as parameters", async () => {
      const res = await request(app).get("/api/credentials").query({ type: "x' OR '1'='1" });
      expect(res.status).toBe(200);
      expect(res.body.credentials).toEqual([]);
      expect(query("SELECT name FROM sqlite_master WHERE name = 'credentials'")).toHaveLength(1);
    });

    it("caps page size", async () => {
      expect((await request(app).get("/api/risk").query({ limit: 100000 })).status).toBe(400);
      expect((await request(app).get("/api/risk").query({ limit: 50 })).status).toBe(200);
    });
  });

  describe("audit trail integrity", () => {
    const entry = { action: "manual_review", resource: "customer:C-1", risk_level: "low" };

    it("requires authentication to write", async () => {
      expect((await request(app).post("/api/audit").send(entry)).status).toBe(401);
    });

    it("forbids viewers from writing", async () => {
      const res = await request(app).post("/api/audit").set("Authorization", bearer("viewer")).send(entry);
      expect(res.status).toBe(403);
    });

    it("records the authenticated user as actor, ignoring any client-supplied actor", async () => {
      const res = await request(app)
        .post("/api/audit")
        .set("Authorization", bearer("analyst", "alice@safeco.com"))
        .send({ ...entry, actor: "someone-else@safeco.com" });

      expect(res.status).toBe(201);
      expect(res.body.actor).toBe("alice@safeco.com");
      const stored = query<{ actor: string }>("SELECT actor FROM audit_entries WHERE id = ?", [res.body.id]);
      expect(stored[0].actor).toBe("alice@safeco.com");
    });

    it("restricts export to analysts and admins", async () => {
      expect((await request(app).get("/api/audit/actions/export")).status).toBe(401);
      expect((await request(app).get("/api/audit/actions/export").set("Authorization", bearer("viewer"))).status).toBe(403);
      const res = await request(app)
        .get("/api/audit/actions/export")
        .query({ format: "csv", period: "all" })
        .set("Authorization", bearer("admin"));
      expect(res.status).toBe(200);
      expect(res.text.split("\n")[0]).toBe("id,timestamp,actor,action,resource,risk_level,compliance_relevant");
    });
  });

  describe("tokens", () => {
    it("demo tokens are read-only", async () => {
      const { body } = await request(app).post("/api/auth/demo-token");
      expect(body.user.role).toBe("viewer");
      const write = await request(app)
        .post("/api/audit")
        .set("Authorization", `Bearer ${body.token}`)
        .send({ action: "x", resource: "y", risk_level: "low" });
      expect(write.status).toBe(403);
    });

    it("rejects tokens signed with another secret", async () => {
      const forged = jwt.sign({ id: "x", email: "evil@x.com", role: "admin" }, "not-the-secret");
      expect((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${forged}`)).status).toBe(401);
    });

    it("rejects unsigned (alg: none) tokens", async () => {
      const unsigned = jwt.sign({ id: "x", email: "evil@x.com", role: "admin" }, "", { algorithm: "none" });
      expect((await request(app).get("/api/auth/me").set("Authorization", `Bearer ${unsigned}`)).status).toBe(401);
    });

    it("login issues a working token", async () => {
      const login = await request(app).post("/api/auth/login").send({ email: "analyst@safeco.com", password: "analyst123" });
      expect(login.status).toBe(200);
      const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.token}`);
      expect(me.body.user.role).toBe("analyst");
    });
  });

  describe("csvCell", () => {
    it.each([
      ["plain", "plain"],
      ["a,b", '"a,b"'],
      ['say "hi"', '"say ""hi"""'],
      ["=HYPERLINK(\"http://evil\")", '"\'=HYPERLINK(""http://evil"")"'],
      ["+1+1", "\"'+1+1\""],
      [null, ""],
      [3, "3"],
    ])("%s -> %s", (input, expected) => {
      expect(csvCell(input)).toBe(expected);
    });
  });
});
