import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ASSETS_DIR = path.resolve(process.cwd(), "docs/assets");
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  await page.goto("http://localhost:3000/pipeline", { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("veloce_theme", "dark");
    const card = document.querySelector('[data-candidate-id]') || document.querySelector('.cursor-pointer');
    if (card) card.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const tabs = ["scorecards", "notes", "interviews", "timeline"];
  for (const tab of tabs) {
    console.log(`Capturing tab ${tab}...`);
    await page.evaluate((t) => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const tabBtn = buttons.find((b) => b.textContent && b.textContent.toLowerCase().includes(t));
      if (tabBtn) tabBtn.click();
    }, tab);
    await new Promise((r) => setTimeout(r, 500));
    const outPath = path.join(ASSETS_DIR, `dossier-${tab}-dark.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved ${outPath}`);
  }

  await browser.close();
}

run();
