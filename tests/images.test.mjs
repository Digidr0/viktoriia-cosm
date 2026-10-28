import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

test("large infographic uses WebP and stays within its size budget", async () => {
  const file = new URL("../public/docs/BNC.webp", import.meta.url);
  const bytes = await readFile(file);
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  assert.ok(bytes.length < 1000000, "Infographic must remain below 1 MB");
  await assert.rejects(access(new URL("../public/docs/BNC.jpg", import.meta.url)), { code: "ENOENT" });
  const source = await readFile(new URL("../src/pages/Promotions.jsx", import.meta.url), "utf8");
  assert.match(source, /\/docs\/BNC\.webp/);
  assert.doesNotMatch(source, /\/docs\/BNC\.jpg/);
});

test("portrait preserves its public JPEG URL with a smaller payload", async () => {
  const bytes = await readFile(new URL("../public/Portrait-3_bg.jpg", import.meta.url));
  assert.equal(bytes.readUInt16BE(0), 0xffd8);
  assert.ok(bytes.length < 100000, "Portrait must remain below 100 KB");
});

test("favicon is sized for a 32px icon on a high-density display", async () => {
  const bytes = await readFile(new URL("../public/facial-treatment.png", import.meta.url));
  assert.equal(bytes.toString("hex", 0, 8), "89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16), 64);
  assert.equal(bytes.readUInt32BE(20), 64);
  assert.ok(bytes.length < 8000);
});

test("all static procedure cards resolve to existing compact images", async () => {
  const cards = JSON.parse(await readFile(new URL("../src/data/services.json", import.meta.url), "utf8"));
  for (const card of cards) {
    const file = new URL(`../public/services/${card.src}`, import.meta.url);
    assert.ok((await stat(file)).size < 100000, `${card.src} is unexpectedly large`);
  }
});
