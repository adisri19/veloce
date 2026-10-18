import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const ASSETS_DIR = path.resolve(process.cwd(), "docs/assets");
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function run() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--window-size=1440,900"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const capture = async (name, url, setupFn) => {
    console.log(`Capturing ${name}...`);
    await page.goto(url, { waitUntil: "networkidle0" });
    if (setupFn) {
      await setupFn(page);
    }
    await new Promise((r) => setTimeout(r, 600));
    const outPath = path.join(ASSETS_DIR, `${name}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved ${outPath}`);
  };

  const setDark = async (p) => {
    await p.evaluate(() => {
      document.documentElement.classList.add("dark");
      localStorage.setItem("veloce_theme", "dark");
    });
  };

  const setLight = async (p) => {
    await p.evaluate(() => {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("veloce_theme", "light");
    });
  };

  try {
    // 1. Dashboard Dark & Light
    await capture("dashboard-dark", "http://localhost:3000/dashboard", setDark);
    await capture("dashboard-light", "http://localhost:3000/dashboard", setLight);

    // 2. Pipeline Kanban Dark & Light
    await capture("pipeline-kanban-dark", "http://localhost:3000/pipeline", setDark);
    await capture("pipeline-kanban-light", "http://localhost:3000/pipeline", setLight);

    // 3. Pipeline Grid Dark
    await capture("pipeline-grid-dark", "http://localhost:3000/pipeline", async (p) => {
      await setDark(p);
      await p.evaluate(() => {
        // click Grid view button
        const buttons = Array.from(document.querySelectorAll("button"));
        const gridBtn = buttons.find((b) => b.textContent && b.textContent.includes("Grid"));
        if (gridBtn) gridBtn.click();
      });
    });

    // 4. Pipeline Split Triage Dark
    await capture("pipeline-split-dark", "http://localhost:3000/pipeline", async (p) => {
      await setDark(p);
      await p.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const splitBtn = buttons.find((b) => b.textContent && b.textContent.includes("Split"));
        if (splitBtn) splitBtn.click();
      });
    });

    // 5. ⌘K Palette
    await capture("command-palette-dark", "http://localhost:3000/dashboard", async (p) => {
      await setDark(p);
      await p.keyboard.down("Meta");
      await p.keyboard.press("k");
      await p.keyboard.up("Meta");
      await new Promise((r) => setTimeout(r, 400));
    });

    // 6. Dossier Drawer (Tabs)
    await capture("dossier-overview-dark", "http://localhost:3000/pipeline", async (p) => {
      await setDark(p);
      await p.evaluate(() => {
        // Click first candidate card
        const card = document.querySelector('[data-candidate-id]') || document.querySelector('.cursor-pointer');
        if (card) card.click();
      });
      await new Promise((r) => setTimeout(r, 500));
    });

    // 7. Jobs Dark
    await capture("jobs-grid-dark", "http://localhost:3000/jobs", setDark);
    await capture("jobs-grid-light", "http://localhost:3000/jobs", setLight);

    // 8. Compare Matrix Dark
    await capture("compare-matrix-dark", "http://localhost:3000/compare", setDark);

    console.log("All captures completed successfully!");
  } catch (err) {
    console.error("Error capturing assets:", err);
  } finally {
    await browser.close();
  }
}

run();
