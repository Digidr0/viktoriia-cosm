import assert from "node:assert/strict";
import test from "node:test";
import { moveService } from "../src/utils/serviceOrder.js";

const rows = [
  { id: 1, category_id: 1, sort_order: 0, title: "A", price: 100 },
  { id: 2, category_id: 1, sort_order: 0, title: "B", price: 200 },
  { id: 3, category_id: 1, sort_order: 10, title: "C", price: 300 },
  { id: 4, category_id: 2, sort_order: 0, title: "D", price: 400 },
];

test("service reorder normalizes duplicate ranks and leaves other categories untouched", () => {
  const result = moveService(rows, "1", 3, 1);
  assert.deepEqual(result.rows.filter((r) => r.category_id === 1).map((r) => [r.id, r.sort_order]), [[3, 0], [1, 1], [2, 2]]);
  assert.equal(result.rows.find((r) => r.id === 4), rows[3]);
  assert.equal(rows[2].sort_order, 10);
  assert.equal(result.rows.find((r) => r.id === 3).price, 300);
});

test("service reorder moves down and rejects invalid/category-crossing/no-op drops", () => {
  assert.deepEqual(moveService(rows, 1, 1, 3).rows.filter((r) => r.category_id === 1).map((r) => r.id), [2, 3, 1]);
  for (const [from, to] of [[1, 1], [1, 4], [9, 1], [1, 9]]) assert.equal(moveService(rows, 1, from, to), null);
});
