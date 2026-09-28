import { chromium } from "@playwright/test";
import sharp from "sharp";

// Match the original story-seat capture: same viewport, progress, and 5:4 crop.
// Only the offline drawing-buffer resolution changes; the live renderer keeps its DPR budget.
const browser = await chromium.launch({
  args: process.platform === "darwin" ? ["--use-angle=metal"] : [],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.addInitScript(() => {
    window.__captureRoots = [];
    const renderers = new Map();
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      supportsFiber: true,
      renderers,
      inject(renderer) {
        const id = renderers.size + 1;
        renderers.set(id, renderer);
        return id;
      },
      onCommitFiberRoot(_id, root) {
        if (!window.__captureRoots.includes(root)) window.__captureRoots.push(root);
      },
      onCommitFiberUnmount() {},
      onPostCommitFiberRoot() {},
    };
  });
  await page.goto(process.env.PREVIEW_URL ?? "http://localhost:3001");
  await page.getByRole("link", { name: "Enter the test" }).click();
  await page.locator('.scene-canvas[data-ready="true"]').waitFor();
  await page.locator("#story").evaluate((el) => {
    scrollTo({ top: el.getBoundingClientRect().top + scrollY + 0.998 * 7800, behavior: "instant" });
  });
  await page.waitForFunction(
    () =>
      Math.abs(Number(document.querySelector(".scene-canvas canvas")?.dataset.progress) - 0.998) <
      0.001,
  );
  await page.waitForTimeout(300);
  const data = await page.evaluate(() => {
    const canvas = document.querySelector(".scene-canvas canvas");
    const store = window.__captureRoots
      .map((root) => root.current.stateNode.containerInfo)
      .filter((container) => typeof container?.getState === "function")
      .map((container) => container.getState())
      .find((state) => state.gl.domElement === canvas);
    if (!store) throw new Error("Cannot find the story renderer for capture");
    store.gl.setPixelRatio(3);
    if (canvas.width !== 4320 || canvas.height !== 2880) {
      throw new Error("Expected a native 4320 × 2880 drawing buffer");
    }
    // Capture synchronously after drawing, before WebGL clears its back buffer.
    store.gl.render(store.scene, store.camera);
    return canvas.toDataURL("image/png");
  });
  const source = Buffer.from(data.split(",")[1], "base64");
  for (const width of [750, 1200, 2400]) {
    await sharp(source)
      .extract({ left: 440 * 3, top: 90 * 3, width: 1000 * 3, height: 800 * 3 })
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 94, effort: 6 })
      .toFile(`public/images/product/product-seat-${width}.webp`);
  }
} finally {
  await browser.close();
}
