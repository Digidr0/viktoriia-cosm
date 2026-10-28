import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("retired destructive scripts are absent", async () => {
  for (const name of ["schema.sql", "full-seed.sql", "seed-supabase.mjs", "generate-full-sql.mjs"]) {
    await assert.rejects(access(new URL(`../scripts/${name}`, import.meta.url)), { code: "ENOENT" });
  }
});

test("search_path migration only alters the existing function configuration", async () => {
  const sql = await readFile(new URL("../scripts/migrations/002-lock-updated-at-search-path.sql", import.meta.url), "utf8");
  const statements = sql.replace(/--[^\n]*/g, "").split(";").map((part) => part.trim()).filter(Boolean);
  assert.deepEqual(statements, ["begin", "alter function public.set_updated_at() set search_path = ''", "commit"]);
});

test("legacy timestamp setup cannot recreate an unsafe trigger function", async () => {
  const sql = await readFile(new URL("../scripts/add-updated-at.sql", import.meta.url), "utf8");
  assert.match(sql, /function public\.set_updated_at\(\)[\s\S]*?set search_path = ''\s+as \$\$/);
});
