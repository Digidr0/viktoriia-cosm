import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

// Load the real API modules with an isolated fake client. Never contacts Supabase.
async function loadApi(name, client) {
  const context = vm.createContext({ setTimeout, clearTimeout, AbortController });
  const clientModule = new vm.SyntheticModule(["supabase"], function () {
    this.setExport("supabase", client);
  }, { context });
  const requestModule = new vm.SourceTextModule(
    await readFile(new URL("../src/api/request.js", import.meta.url), "utf8"),
    { context }
  );
  const networkModule = new vm.SourceTextModule(
    await readFile(new URL("../src/utils/network.js", import.meta.url), "utf8"),
    { context }
  );
  const apiModule = new vm.SourceTextModule(
    await readFile(new URL(`../src/api/${name}.js`, import.meta.url), "utf8"),
    { context }
  );
  await apiModule.link((specifier) => {
    if (specifier === "../utils/supabase") return clientModule;
    if (specifier === "./request") return requestModule;
    if (specifier === "../utils/network") return networkModule;
    throw new Error(`Unexpected dependency: ${specifier}`);
  });
  await apiModule.evaluate();
  return apiModule.namespace;
}

function mockClient(result = { data: [], error: null }) {
  const calls = [];
  const client = {
    calls,
    from(table) {
      const call = { table, steps: [] };
      calls.push(call);
      const query = {
        then(resolve, reject) {
          return Promise.resolve(typeof result === "function" ? result(table) : result).then(resolve, reject);
        },
      };
      for (const method of ["select", "order", "eq", "insert", "update", "delete"]) {
        query[method] = (...args) => {
          call.steps.push([method, ...args]);
          return query;
        };
      }
      return query;
    },
  };
  return client;
}

test("catalog loads both tables in sort order", async () => {
  const categories = [{ id: 1, name: "Category" }];
  const services = [{ id: 2, category_id: 1, title: "Service" }];
  const client = mockClient((table) => ({ data: table === "categories" ? categories : services }));
  const api = await loadApi("catalog", client);
  const data = await api.loadCatalog();
  assert.equal(data.categories, categories);
  assert.equal(data.services, services);
  assert.deepEqual(client.calls.map((call) => call.table), ["categories", "services"]);
  for (const call of client.calls) {
    assert.equal(call.steps[0][0], "select");
    assert.equal(call.steps[1][0], "order");
    assert.equal(call.steps[1][1], "sort_order");
    assert.equal(call.steps[1][2].ascending, true);
  }
});

test("service order updates only ranks and stops on the first failed write without retry", async () => {
  let attempts = 0;
  const client = mockClient(() => ++attempts === 2 ? { error: new Error("Write failed") } : { data: null });
  const api = await loadApi("catalog", client);
  await assert.rejects(api.saveServiceOrder([{ id: 3, sort_order: 0 }, { id: 1, sort_order: 1 }, { id: 2, sort_order: 2 }]), /Write failed/);
  assert.equal(client.calls.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(client.calls[0].steps)), [["update", { sort_order: 0 }], ["eq", "id", 3]]);
});

test("catalog handles empty data and propagates request errors", async () => {
  const emptyApi = await loadApi("catalog", mockClient({ data: null }));
  assert.equal((await emptyApi.listCategories()).length, 0);
  assert.equal((await emptyApi.listServices()).length, 0);
  const error = new Error("Access denied");
  const api = await loadApi("catalog", mockClient({ data: null, error }));
  await assert.rejects(api.loadCatalog(), (caught) => caught === error);
});

for (const [name, table, save, remove] of [
  ["catalog", "categories", "saveCategory", "deleteCategory"],
  ["catalog", "services", "saveService", "deleteService"],
  ["promotions", "promotions", "savePromotion", "deletePromotion"],
]) {
  test(`${table}: insert, targeted update/delete, and write errors`, async () => {
    const client = mockClient({ data: null });
    const api = await loadApi(name, client);
    const payload = { title: "Test" };
    await api[save](undefined, payload);
    await api[save](42, payload);
    await api[remove](42);
    assert.deepEqual(client.calls.map((call) => call.table), [table, table, table]);
    assert.deepEqual(client.calls[0].steps, [["insert", payload]]);
    assert.deepEqual(client.calls[1].steps, [["update", payload], ["eq", "id", 42]]);
    assert.deepEqual(client.calls[2].steps, [["delete"], ["eq", "id", 42]]);
    const error = new Error("Write rejected");
    const failedApi = await loadApi(name, mockClient({ error }));
    await assert.rejects(failedApi[save](42, payload), (caught) => caught === error);
    await assert.rejects(failedApi[remove](42), (caught) => caught === error);
  });
}

test("public promotions filter active rows; admin list does not", async () => {
  const client = mockClient();
  const api = await loadApi("promotions", client);
  await api.listPromotions({ activeOnly: true });
  await api.listPromotions();
  assert.deepEqual(client.calls[0].steps.find((step) => step[0] === "eq"), ["eq", "is_active", true]);
  assert.equal(client.calls[1].steps.some((step) => step[0] === "eq"), false);
});

test("auth wraps session, sign-in/out, subscription cleanup and own-role RPC", async () => {
  const session = { user: { id: "test-user" } };
  let rpcName;
  let credentials;
  let unsubscribed = false;
  let signedOut = false;
  const api = await loadApi("auth", {
    rpc: async (name) => { rpcName = name; return { data: true }; },
    auth: {
      getSession: async () => ({ data: { session } }),
      signInWithPassword: async (values) => { credentials = values; return { data: session }; },
      signOut: async () => { signedOut = true; return { error: null }; },
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() { unsubscribed = true; } } } }),
    },
  });
  assert.equal(await api.getSession(), session);
  assert.equal(await api.checkAdminAccess(), true);
  assert.equal(rpcName, "is_admin");
  assert.equal(await api.signIn("test@example.test", "not-a-real-password"), session);
  assert.equal(credentials.email, "test@example.test");
  assert.equal(credentials.password, "not-a-real-password");
  api.subscribeToAuthChanges(() => {})();
  assert.equal(unsubscribed, true);
  await api.signOut();
  assert.equal(signedOut, true);
});

test("admin access fails closed on false, malformed data, and RPC errors", async () => {
  for (const data of [false, null, "true", 1]) {
    const api = await loadApi("auth", { rpc: async () => ({ data }) });
    assert.equal(await api.checkAdminAccess(), false);
  }
  const error = new Error("RPC unavailable");
  const api = await loadApi("auth", { rpc: async () => ({ error }) });
  await assert.rejects(api.checkAdminAccess(), (caught) => caught === error);
});

test("components, pages and context do not import the database client or build queries", async () => {
  async function checkDirectory(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const url = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
      if (entry.isDirectory()) {
        await checkDirectory(url);
      } else if (/\.[jt]sx?$/.test(entry.name)) {
        const source = await readFile(url, "utf8");
        assert.doesNotMatch(source, /utils\/supabase|\.(?:from|rpc)\s*\(/, url.pathname);
      }
    }
  }
  for (const directory of ["components", "pages", "context"]) {
    await checkDirectory(new URL(`../src/${directory}/`, import.meta.url));
  }
});
