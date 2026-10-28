import assert from "node:assert/strict";
import test from "node:test";
import { withConnectionGuard, saveErrorMessage } from "../src/utils/network.js";

function fakeConnection(t, online) {
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const events = new EventTarget();
  const navigator = { onLine: online };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: navigator });
  Object.defineProperty(globalThis, "window", { configurable: true, value: events });
  t.after(() => {
    if (navigatorDescriptor) Object.defineProperty(globalThis, "navigator", navigatorDescriptor);
    else delete globalThis.navigator;
    if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
    else delete globalThis.window;
  });
  return (next) => {
    navigator.onLine = next;
    events.dispatchEvent(new Event(next ? "online" : "offline"));
  };
}

test("offline request fails immediately without starting the operation", async (t) => {
  fakeConnection(t, false);
  let started = false;
  await assert.rejects(withConnectionGuard(() => { started = true; }), { code: "OFFLINE" });
  assert.equal(started, false);
});

test("disconnect aborts a pending request and stops waiting", async (t) => {
  const setOnline = fakeConnection(t, true);
  let signal;
  const pending = withConnectionGuard((next) => { signal = next; return new Promise(() => {}); });
  await Promise.resolve();
  const assertion = assert.rejects(pending, { code: "CONNECTION_LOST" });
  setOnline(false);
  await assertion;
  assert.equal(signal.aborted, true);
});

test("hanging request times out and is aborted", async (t) => {
  fakeConnection(t, true);
  let signal;
  await assert.rejects(withConnectionGuard((next) => {
    signal = next;
    return new Promise(() => {});
  }, { timeoutMs: 10 }), { code: "TIMEOUT" });
  assert.equal(signal.aborted, true);
});

test("success removes offline listeners and does not abort the completed request", async (t) => {
  const setOnline = fakeConnection(t, true);
  let signal;
  assert.equal(await withConnectionGuard((next) => { signal = next; return 42; }), 42);
  setOnline(false);
  assert.equal(signal.aborted, false);
});

test("network failures have a readable message; ordinary server errors are preserved", async (t) => {
  fakeConnection(t, true);
  await assert.rejects(withConnectionGuard(() => Promise.reject(new TypeError("Failed to fetch"))), { code: "NETWORK_ERROR" });
  const error = new Error("Permission denied");
  await assert.rejects(withConnectionGuard(() => Promise.reject(error)), (caught) => caught === error);
});

test("uncertain writes warn about checking data; preflight offline does not imply a write", () => {
  assert.match(saveErrorMessage({ code: "TIMEOUT", message: "Сервер не ответил." }), /не подтверждён/);
  assert.match(saveErrorMessage({ code: "CONNECTION_LOST", message: "Связь потеряна." }), /перед повторной отправкой/);
  assert.equal(saveErrorMessage({ code: "OFFLINE", message: "Нет интернета." }), "Нет интернета.");
});
