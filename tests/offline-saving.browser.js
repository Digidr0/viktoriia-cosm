// Run with Playwright MCP against the local preview. All API requests are mocked.
async (page) => {
  const context = await page.context().browser().newContext();
  const p = await context.newPage();
  try {
    const user = {
      id: "11111111-1111-4111-8111-111111111111",
      email: "local-test@example.test", aud: "authenticated", role: "authenticated",
      app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString(),
    };
    const token = [
      { alg: "HS256", typ: "JWT" },
      { sub: user.id, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 },
    ].map((value) => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".test";
    const headers = { "access-control-allow-origin": "*" };
    const categories = [{ id: 1, name: "Тестовая категория", slug: "test", sort_order: 0 }];
    const service = { id: 2, category_id: 1, title: "Тестовая услуга", price: 1500, sort_order: 0 };
    let writes = 0;
    let pendingWrite;
    let hangReads = false;
    await p.route("**/auth/v1/**", (route) => route.fulfill({
      json: route.request().url().includes("/token")
        ? { access_token: token, refresh_token: "test-refresh", expires_in: 3600, token_type: "bearer", user }
        : user,
      headers,
    }));
    await p.route("**/rest/v1/**", async (route) => {
      const request = route.request();
      if (request.method() === "PATCH" || request.method() === "POST" && !request.url().includes("/rpc/")) {
        writes++;
        pendingWrite = route;
        return;
      }
      if (hangReads && !request.url().includes("/rpc/")) return;
      await route.fulfill({
        json: request.url().includes("/rpc/") ? true
          : request.url().includes("/categories") ? categories
          : request.url().includes("/services") ? [service] : [],
        headers,
      });
    });

    await p.goto("http://127.0.0.1:4173/viktoriia-cosm/admin/login");
    await p.getByLabel("Email", { exact: true }).fill(user.email);
    await p.getByLabel("Пароль", { exact: true }).fill("not-real-password");
    await p.getByRole("button", { name: "Войти", exact: true }).click();
    await p.getByText(service.title, { exact: true }).waitFor();
    await p.locator('.ant-table-tbody tr[data-row-key="2"] button').first().click();
    const dialog = p.getByRole("dialog");
    const price = dialog.getByLabel("Цена, ₽", { exact: true });
    await price.fill("2500");
    await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
    await dialog.locator(".ant-spin-spinning").waitFor();
    if (!await price.isDisabled()) throw new Error("Form not disabled while saving");
    if (!await dialog.getByRole("button", { name: "Отмена", exact: true }).isDisabled()) throw new Error("Cancel is enabled while saving");
    if (!await dialog.getByRole("button", { name: /Сохраняем/ }).isDisabled()) throw new Error("Duplicate submission is not blocked");
    if (writes !== 1 || !pendingWrite) throw new Error("Expected one pending write");

    await context.setOffline(true);
    await p.getByText(/Нет соединения с интернетом\. Сохранение недоступно/).waitFor();
    await dialog.getByText(/Результат сохранения не подтверждён/).waitFor();
    await dialog.locator(".ant-spin-spinning").waitFor({ state: "hidden" });
    if (await price.inputValue() !== "2500") throw new Error("Draft was lost after disconnect");
    if (!await dialog.getByRole("button", { name: "Сохранить", exact: true }).isDisabled()) throw new Error("Save is enabled offline");
    await pendingWrite.abort().catch(() => {});
    pendingWrite = null;

    await context.setOffline(false);
    await dialog.getByRole("button", { name: "Сохранить", exact: true }).waitFor();
    await p.waitForFunction(() => {
      const button = [...document.querySelectorAll('.ant-modal-footer button')].find((item) => item.textContent.includes('Сохранить'));
      return button && !button.disabled;
    });
    if (writes !== 1) throw new Error("Write was automatically retried on reconnect");
    if (await price.inputValue() !== "2500") throw new Error("Draft was lost after reconnect");
    await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
    await dialog.locator(".ant-spin-spinning").waitFor();
    await p.waitForFunction(() => document.querySelector('.ant-modal .ant-btn-loading') !== null);
    if (writes !== 2 || !pendingWrite) throw new Error("Manual retry was not sent");
    Object.assign(service, pendingWrite.request().postDataJSON());
    await pendingWrite.fulfill({ status: 204, headers });
    pendingWrite = null;
    await dialog.waitFor({ state: "hidden" });
    await p.getByText("Услуга обновлена", { exact: true }).waitFor();

    // Accelerate only the deadline test; no real 15-second wait is needed.
    await p.clock.install();
    hangReads = true;
    await p.getByRole("link", { name: "На сайт", exact: true }).click();
    await p.getByRole("link", { name: "Прайсы", exact: true }).click();
    await p.locator(".Prices .ant-spin-spinning").waitFor();
    await p.clock.fastForward(15100);
    await p.getByText("Не удалось загрузить прайс", { exact: true }).waitFor();
    await p.getByText(/Сервер не ответил за 15 секунд/).waitFor();
    await p.getByRole("button", { name: "Повторить", exact: true }).waitFor();
    hangReads = false;
    await p.getByRole("button", { name: "Повторить", exact: true }).click();
    await p.getByText(service.title, { exact: true }).waitFor();

    return { savingSpinner: true, duplicateBlocked: true, disconnectHandled: true, draftPreserved: true, noAutomaticWriteRetry: true, manualRetry: true, timeoutAndReadRetry: true };
  } finally {
    await context.close();
  }
}
