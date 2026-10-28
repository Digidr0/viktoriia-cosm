// Playwright MCP browser_run_code_unsafe filename; uses only local mock data.
async (page) => {
  const context = await page.context().browser().newContext();
  const p = await context.newPage();
  try {
    const user = {
      id: "11111111-1111-4111-8111-111111111111",
      email: "local-test@example.test",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: { provider: "email" },
      user_metadata: {},
      created_at: new Date().toISOString(),
    };
    const token = [
      { alg: "HS256", typ: "JWT" },
      { sub: user.id, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 },
    ].map((value) => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".test";
    const categories = [
      { id: 1, name: "Первая категория", sort_order: 0 },
      { id: 2, name: "Вторая категория", sort_order: 1 },
      { id: 3, name: "Аппаратная косметология и комбинированные процедуры для лица", sort_order: 2 },
    ];
    const services = [
      ...Array.from({ length: 125 }, (_, i) => ({ id: i + 1, category_id: 1, title: `Первая услуга ${i + 1}`, price: 1500 })),
      ...Array.from({ length: 65 }, (_, i) => ({ id: i + 201, category_id: 2, title: `Вторая услуга ${i + 1}`, price: 2000 })),
    ];
    const headers = { "access-control-allow-origin": "*" };
    await p.route("**/auth/v1/**", (route) => route.fulfill({
      json: route.request().url().includes("/token")
        ? { access_token: token, refresh_token: "test-refresh", expires_in: 3600, token_type: "bearer", user }
        : user,
      headers,
    }));
    await p.route("**/rest/v1/**", (route) => route.fulfill({
      json: route.request().url().includes("/rpc/") ? true
        : route.request().url().includes("/categories") ? categories : services,
      headers,
    }));
    await p.goto("http://127.0.0.1:4173/viktoriia-cosm/admin/login");
    await p.getByLabel("Email", { exact: true }).fill(user.email);
    await p.getByLabel("Пароль", { exact: true }).fill("not-real-password");
    await p.getByRole("button", { name: "Войти", exact: true }).click();
    await p.getByText("Первая услуга 1", { exact: true }).waitFor();
    await p.getByRole("heading", { name: "Первая категория", exact: true }).waitFor();

    const rows = p.locator(".ant-table-tbody tr[data-row-key]");
    if (await rows.count() !== 50) throw new Error("Default page size is not 50");
    if (await p.getByText("Вторая услуга 1", { exact: true }).count()) throw new Error("Wrong category rows");

    await p.locator(".ant-pagination-options-size-changer").click();
    await p.locator(".ant-select-item-option").filter({ hasText: /^20\s*\// }).click();
    await p.waitForFunction(() => document.querySelectorAll(".ant-table-tbody tr[data-row-key]").length === 20);
    await p.locator(".ant-pagination-item-2").click();
    await p.getByText("Первая услуга 21", { exact: true }).waitFor();

    await p.locator(".admin-toolbar .ant-select").first().click();
    await p.locator(".ant-select-item-option").filter({ hasText: "Вторая категория" }).click();
    await p.getByText("Вторая услуга 1", { exact: true }).waitFor();
    await p.getByRole("heading", { name: "Вторая категория", exact: true }).waitFor();
    if (await rows.count() !== 20) throw new Error("Page size was not preserved");
    if (await p.locator(".ant-pagination-item-active").textContent() !== "1") throw new Error("Category did not reset page");

    await p.locator(".admin-toolbar .ant-select").first().click();
    if (await p.locator(".ant-select-item-option").filter({ hasText: "Все категории" }).count()) throw new Error("All categories option still present");
    await p.keyboard.press("Escape");
    await p.locator(".ant-pagination-item-2").click();
    await p.getByPlaceholder("Поиск...").fill("Вторая услуга 65");
    await p.getByText("Вторая услуга 65", { exact: true }).waitFor();
    if (await rows.count() !== 1) throw new Error("Search result incorrect");
    if (await p.locator(".ant-pagination-item-active").textContent() !== "1") throw new Error("Search did not reset page");

    await p.getByRole("tab", { name: "Категории", exact: true }).click();
    await p.getByRole("heading", { name: "Категории", exact: true }).waitFor();
    await p.getByRole("tab", { name: "Акции", exact: true }).click();
    await p.getByRole("heading", { name: "Акции", exact: true }).waitFor();
    await p.getByRole("tab", { name: "Услуги и цены", exact: true }).click();
    await p.getByRole("heading", { name: "Вторая категория", exact: true }).waitFor();
    await p.locator(".admin-toolbar .ant-select").first().click();
    await p.locator(".ant-select-item-option").filter({ hasText: categories[2].name }).click();
    await p.getByRole("heading", { name: categories[2].name, exact: true }).waitFor();

    for (const width of [1100, 700, 375, 320]) {
      await p.setViewportSize({ width, height: 900 });
      const title = await p.locator(".admin-section-title").boundingBox();
      const tabs = await p.locator(".admin-tabs > .ant-tabs-nav > .ant-tabs-nav-wrap").boundingBox();
      if (!title || !tabs || title.x < 0 || title.x + title.width > width + 1) throw new Error(`Title overflows at ${width}px`);
      const overlaps = title.x < tabs.x + tabs.width && title.x + title.width > tabs.x
        && title.y < tabs.y + tabs.height && title.y + title.height > tabs.y;
      if (overlaps) throw new Error(`Title overlaps tabs at ${width}px`);
    }

    return { firstCategory: true, default50: true, pageSize20: true, categoryResetsPage: true, noAllCategories: true, searchResetsPage: true, sectionTitles: true, responsiveTitle: true };
  } finally {
    await context.close();
  }
}
