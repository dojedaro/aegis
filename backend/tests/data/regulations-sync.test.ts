import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { ARTICLES } from "../../src/data/regulations.js";

/**
 * The agent may only cite articles from the backend library (record_finding rejects anything else), and
 * the web app's regulation browser shows its own copy. If the two drift, a user can be shown a finding
 * citing an article the browser doesn't list, or under a different title. The backend is canonical.
 */
describe("regulation libraries", () => {
  const web = readFileSync(new URL("../../../web/src/data/regulations.ts", import.meta.url), "utf-8");
  const webTitles = new Map(
    [...web.matchAll(/id:\s*"([a-z0-9-]+)",\s*\n\s*title:\s*"([^"]*)"/g)].map((m) => [m[1], m[2]] as const)
  );

  it("every article the agent can cite appears in the web app with the same title", () => {
    const problems = ARTICLES.filter((a) => webTitles.get(a.id) !== a.title).map(
      (a) => `${a.id}: backend "${a.title}" vs web "${webTitles.get(a.id) ?? "(missing)"}"`
    );
    expect(problems).toEqual([]);
  });
});
