import { bundle } from "@remotion/bundler";
import {
  selectComposition,
  renderStill,
  openBrowser,
} from "@remotion/renderer";
import fs from "node:fs";
const url = await bundle({ entryPoint: "src/index.ts" });
const browser = await openBrowser("chrome", {
  browserExecutable: "/usr/bin/chromium",
  chromiumOptions: { gl: "swangle" },
});
try {
  const opts = {
    serveUrl: url,
    puppeteerInstance: browser,
    composition: await selectComposition({
      serveUrl: url,
      id: process.env.AZI_REVIEW_COMPOSITION ?? "AziFilm",
      puppeteerInstance: browser,
    }),
    imageFormat: "png",
    scale: 0.5,
  };
  let frames = process.argv.slice(2).map(Number);
  if (!frames.length) {
    const t = JSON.parse(fs.readFileSync("timing.json"));
    frames = t.scenes
      .flatMap((s) => [s.start + 0.7, (s.start + s.end) / 2, s.end - 0.4])
      .map((t) => Math.floor(t * 30));
  }
  for (const frame of frames) {
    await renderStill({ ...opts, frame, output: `${process.env.AZI_REVIEW_DIR??"review/v06"}/frame-${frame}.png` });
    console.log(frame);
  }
} finally {
  await browser.close({ silent: true });
}
