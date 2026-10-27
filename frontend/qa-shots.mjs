import { mkdir } from "node:fs/promises";
import path from "node:path";

const out = path.join(process.cwd(), ".qa-shots");

export default async function run(page) {
  await mkdir(out, { recursive: true });
  const shots = [];

  async function shot(name, width, height, theme) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ colorScheme: theme });
    await page.evaluate((t) => {
      document.documentElement.classList.toggle("dark", t === "dark");
      document.documentElement.dataset.theme = t;
    }, theme);
    await page.waitForTimeout(150);
    const file = path.join(out, `${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    shots.push(file);
  }

  for (const theme of ["light", "dark"]) {
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await shot(`home-${theme}-desktop`, 1280, 800, theme);
    await shot(`home-${theme}-phone`, 390, 844, theme);

    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
    await shot(`login-${theme}-desktop`, 1280, 800, theme);
    await shot(`login-${theme}-phone`, 390, 844, theme);

    await page.goto("http://localhost:3000/signup", { waitUntil: "networkidle" });
    await shot(`signup-${theme}-desktop`, 1280, 800, theme);
    await shot(`signup-${theme}-phone`, 390, 844, theme);
  }

  return { shots };
}
