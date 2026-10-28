// Run against the local preview via Playwright MCP. No production services used.
async (page) => {
  const results = [];
  for (const width of [1440, 390]) {
    const context = await page.context().browser().newContext({ viewport: { width, height: 900 } });
    const p = await context.newPage();
    try {
      const pending = [];
      let hold = true;
      await p.route(/\/viktoriia-cosm\/(Portrait-3_bg\.jpg|services\/[^?]+\.webp)/, (route) => {
        if (hold) pending.push(route);
        else return route.continue();
      });
      await p.goto("http://127.0.0.1:4173/viktoriia-cosm/welcome", { waitUntil: "domcontentloaded" });
      await p.evaluate(() => document.fonts.ready);
      await p.locator(".portrait-media .content-image-skeleton").waitFor();
      const portraitBefore = await p.locator(".portrait-media").boundingBox();
      const first = p.locator(".service-media").first();
      await first.scrollIntoViewIfNeeded();
      await first.locator(".content-image-skeleton").waitFor();
      const cardBefore = await first.boundingBox();
      const skeleton = await first.locator(".content-image-skeleton").boundingBox();
      if (Math.abs(cardBefore.width - skeleton.width) > 1 || Math.abs(cardBefore.height - skeleton.height) > 1) {
        throw new Error("Skeleton does not match card image");
      }
      if (!await p.getByRole("button", { name: "Записаться прямо сейчас", exact: true }).isEnabled()) {
        throw new Error("Booking button blocked by skeleton");
      }
      await p.evaluate(() => scrollTo(0, 0));
      await p.screenshot({ path: `.playwright-mcp/skeleton-${width}.png` });
      hold = false;
      for (const route of pending) await route.continue();
      await p.locator(".portrait-media[data-state=ready]").waitFor();
      await first.scrollIntoViewIfNeeded();
      await first.locator("img").evaluate((img) => img.decode());
      await p.locator(".service-media[data-state=ready]").first().waitFor();
      const portraitAfter = await p.locator(".portrait-media").boundingBox();
      const cardAfter = await first.boundingBox();
      if (Math.abs(portraitBefore.height - portraitAfter.height) > 1 || Math.abs(cardBefore.height - cardAfter.height) > 1) {
        throw new Error(`Layout shift after image loaded: ${JSON.stringify({ portraitBefore, portraitAfter, cardBefore, cardAfter })}`);
      }

      // A broken image must stop shimmering and offer a real retry.
      let breakPortrait = true;
      await p.route("**/Portrait-3_bg.jpg", (route) => breakPortrait ? route.abort("failed") : route.continue());
      await p.reload({ waitUntil: "domcontentloaded" });
      await p.locator(".portrait-media[data-state=error]").waitFor();
      breakPortrait = false;
      await p.locator(".portrait-media").getByRole("button", { name: "Загрузить снова", exact: true }).click();
      await p.locator(".portrait-media[data-state=ready]").waitFor();

      await p.unroute("**/Portrait-3_bg.jpg");
      hold = true;
      await p.emulateMedia({ reducedMotion: "reduce" });
      await p.reload({ waitUntil: "domcontentloaded" });
      await p.locator(".portrait-media .ant-skeleton-image").waitFor();
      const animation = await p.locator(".portrait-media .ant-skeleton-image").evaluate((node) => getComputedStyle(node).animationName);
      if (animation !== "none") throw new Error("Skeleton ignores reduced motion");

      await p.clock.install();
      await p.clock.fastForward(15100);
      await p.locator(".portrait-media[data-state=error]").waitFor();
      if (await p.locator(".service-media").last().getAttribute("data-state") !== "loading") {
        throw new Error("Off-screen lazy image timed out before being approached");
      }

      results.push({ width, matchingSkeletons: true, stableLayout: true, bookingAvailable: true, errorRetry: true, reducedMotion: true, timeoutOnlyNearViewport: true });
    } finally {
      await context.close();
    }
  }
  return results;
}
