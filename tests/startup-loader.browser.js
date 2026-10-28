// Run against the local preview via Playwright MCP. Bundle/images can be held independently.
async (page) => {
  const results = [];
  for (const width of [1440, 390]) {
    const context = await page.context().browser().newContext({ viewport: { width, height: 900 } });
    const p = await context.newPage();
    try {
      const pending = [];
      let holdBundle = true;
      await p.route(/\/assets\/[^?]+\.js/, (route) => {
        if (holdBundle) pending.push(route);
        else return route.continue();
      });
      await p.route(/\/viktoriia-cosm\/(Portrait-3_bg\.jpg|services\/[^?]+\.webp)/, () => {});
      await p.clock.install();
      await p.goto("http://127.0.0.1:4173/viktoriia-cosm/welcome", { waitUntil: "commit" });
      await p.locator("#startup-screen").waitFor();
      await p.getByText("Загружаем сайт…", { exact: true }).waitFor();
      if (await p.locator(".content-image-skeleton").count()) throw new Error("Skeleton appeared before bundle was ready");
      const bounds = await p.locator("#startup-screen").boundingBox();
      if (Math.abs(bounds.width - width) > 1 || bounds.x !== 0) throw new Error("Startup screen overflows viewport");
      await p.screenshot({ path: `.playwright-mcp/startup-${width}.png` });
      await p.emulateMedia({ reducedMotion: "reduce" });
      const animation = await p.locator(".startup-dots").evaluate((node) => getComputedStyle(node).animationName);
      if (animation !== "none") throw new Error("Startup animation ignores reduced motion");
      await p.emulateMedia({ reducedMotion: "no-preference" });

      // A hung bundle offers recovery rather than an endless animation.
      await p.clock.fastForward(15100);
      await p.getByText(/Загрузка занимает больше времени/).waitFor();
      await p.getByRole("button", { name: "Обновить страницу", exact: true }).waitFor();
      if (await p.locator("#startup-screen").getAttribute("data-state") !== "error") throw new Error("No slow-load recovery state");
      holdBundle = false;
      for (const route of pending) await route.continue();
      await p.locator("#startup-screen").waitFor({ state: "detached" });
      await p.locator(".portrait-media .content-image-skeleton").waitFor();
      await p.getByRole("button", { name: "Записаться прямо сейчас", exact: true }).waitFor();
      results.push({ width, immediateLoader: true, beforeSkeletons: true, timeoutRecovery: true, reducedMotion: true, skeletonHandoff: true });
    } finally {
      await context.close();
    }
  }

  const noJsContext = await page.context().browser().newContext({ javaScriptEnabled: false });
  try {
    const p = await noJsContext.newPage();
    await p.goto("http://127.0.0.1:4173/viktoriia-cosm/", { waitUntil: "domcontentloaded" });
    await p.getByText("Для работы сайта включите JavaScript в браузере.", { exact: true }).waitFor();
    if (await p.locator("#startup-dots").isVisible()) throw new Error("Endless spinner with JavaScript disabled");
    results.push({ javascriptDisabledMessage: true });
  } finally {
    await noJsContext.close();
  }
  return results;
}
