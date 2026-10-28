// Playwright MCP; local mock backend only, never writes to production.
async (page) => {
  const context = await page.context().browser().newContext({ viewport: { width: 1440, height: 1000 } });
  const p = await context.newPage();
  try {
    const user = { id: "11111111-1111-4111-8111-111111111111", email: "test@example.test", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} };
    const token = [{ alg: "HS256", typ: "JWT" }, { sub: user.id, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 }]
      .map((value) => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".test";
    const services = Array.from({ length: 52 }, (_, i) => ({ id: i + 1, category_id: 1, title: `Услуга ${i + 1}`, price: 100 + i, sort_order: i }));
    let fail = false;
    let writes = 0;
    await p.route("**/auth/v1/**", (route) => route.fulfill({ json: route.request().url().includes("/token")
      ? { access_token: token, refresh_token: "test", expires_in: 3600, token_type: "bearer", user } : user }));
    await p.route("**/rest/v1/**", async (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() === "PATCH") {
        writes++;
        if (fail) return route.fulfill({ status: 500, json: { message: "Test failure" } });
        const id = Number(url.searchParams.get("id").replace("eq.", ""));
        Object.assign(services.find((row) => row.id === id), route.request().postDataJSON());
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: url.pathname.includes("/rpc/") ? true : url.pathname.includes("/categories")
        ? [{ id: 1, name: "Категория", sort_order: 0 }] : [...services].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id) });
    });
    await p.goto("http://127.0.0.1:4173/viktoriia-cosm/admin/login");
    await p.getByLabel("Email", { exact: true }).fill(user.email);
    await p.getByLabel("Пароль", { exact: true }).fill("test-password");
    await p.getByRole("button", { name: "Войти", exact: true }).click();
    const rows = p.locator(".ant-table-tbody tr[data-row-key]");
    await rows.first().waitFor();
    const handle = (id) => p.getByRole("button", { name: `Перетащить услугу «Услуга ${id}»`, exact: true });
    async function expectFirst(id) {
      await p.waitForFunction((id) => document.querySelector(".ant-table-tbody tr[data-row-key]")?.getAttribute("data-row-key") === String(id), id);
      await p.getByPlaceholder("Поиск...").waitFor({ state: "visible" });
      await p.waitForFunction(() => !document.querySelector(".ant-spin-spinning"));
    }
    // Real pointer drag on the handle.
    const a = await handle(1).boundingBox();
    const b = await handle(2).boundingBox();
    await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await p.mouse.down();
    await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 });
    await p.mouse.up();
    await expectFirst(2).catch((e) => { throw new Error(`Pointer drag: ${e.message}; order=${services.slice(0, 3).map(r => `${r.id}:${r.sort_order}`)}`); });
    if (writes !== 2) throw new Error(`Expected 2 rank-only writes, got ${writes}`);
    // Keyboard drag back to first place.
    await handle(1).focus();
    await p.keyboard.press("Space");
    await p.waitForFunction(() => document.querySelector('.ant-table-tbody tr[data-row-key="1"] button[aria-pressed="true"]'));
    await p.keyboard.press("ArrowUp");
    await p.waitForFunction(() => document.querySelector('.ant-table-tbody tr[data-row-key="1"]').style.transform.includes("-"));
    await p.keyboard.press("Space");
    await expectFirst(1).catch((e) => { throw new Error(`Keyboard drag: ${e.message}`); });
    // Non-drag pointer alternative.
    await p.getByRole("button", { name: "Изменить позицию услуги «Услуга 2»", exact: true }).click();
    await p.getByRole("menuitem", { name: "Переместить выше", exact: true }).click();
    await expectFirst(2);
    await p.getByPlaceholder("Поиск...").fill("Услуга 1");
    if (!await handle(1).isDisabled()) throw new Error("Drag allowed while searching");
    await p.getByPlaceholder("Поиск...").fill("");
    // Move across the pagination boundary using the same full-category order.
    await p.locator(".ant-pagination-item-2").click();
    await p.getByRole("button", { name: "Изменить позицию услуги «Услуга 51»", exact: true }).click();
    await p.getByRole("menuitem", { name: "Переместить выше", exact: true }).click();
    await expectFirst(50);
    await p.locator(".ant-pagination-item-1").click();
    await expectFirst(2);
    if (services.find((row) => row.id === 51).sort_order !== 49) throw new Error("Cross-page move failed");
    await p.setViewportSize({ width: 390, height: 900 });
    await handle(1).scrollIntoViewIfNeeded();
    if (!await handle(1).isVisible()) throw new Error("Mobile handle unavailable");
    await context.setOffline(true);
    await p.waitForFunction(() => document.querySelector('.service-drag-handle')?.disabled);
    await context.setOffline(false);
    await p.waitForFunction(() => !document.querySelector('.service-drag-handle')?.disabled);
    // Failure is not retried and blocks further reorder until explicit reload.
    fail = true;
    const before = writes;
    await p.getByRole("button", { name: "Изменить позицию услуги «Услуга 1»", exact: true }).click();
    await p.getByRole("menuitem", { name: "Переместить выше", exact: true }).click();
    await p.getByText("Не удалось сохранить весь порядок", { exact: true }).waitFor();
    if (writes !== before + 1) throw new Error("Failed write retried");
    if (!await handle(1).isDisabled()) throw new Error("Uncertain order not locked");
    return { pointerDrag: true, keyboardDrag: true, menuAlternative: true, crossPageMove: true, mobileHandle: true, offlineGuard: true, persisted: true, searchGuard: true, failureGuard: true };
  } finally {
    await context.close();
  }
}
