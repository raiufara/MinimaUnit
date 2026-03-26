import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const requestedMode = process.argv[2] ?? 'all';
const artifactDir = path.resolve('artifacts', 'smoke');

const routeChecks = [
  {
    name: 'era-age',
    path: '/era-age',
    selectors: ['.today-card', '.result-card-block', '.panel']
  },
  {
    name: 'length',
    path: '/length',
    selectors: ['.length-value-pill', '.length-unit-button', '.length-result-tile']
  },
  {
    name: 'weight',
    path: '/weight',
    selectors: ['.length-value-pill', '.usage-mode-button', '.length-result-tile']
  },
  {
    name: 'area',
    path: '/area',
    selectors: ['.length-value-pill', '.usage-mode-button', '.length-result-tile']
  },
  {
    name: 'volume',
    path: '/volume',
    selectors: ['.length-value-pill', '.length-unit-button', '.length-result-tile']
  },
  {
    name: 'temperature',
    path: '/temperature',
    selectors: ['.length-value-pill', '.length-unit-button', '.length-result-tile']
  },
  {
    name: 'speed',
    path: '/speed',
    selectors: ['.length-value-pill', '.length-unit-button', '.length-result-tile']
  },
  {
    name: 'currency',
    path: '/currency',
    selectors: ['.length-value-pill', '.currency-reference-card', '.length-result-tile']
  }
];

async function ensureArtifacts() {
  await fs.mkdir(artifactDir, { recursive: true });
}

async function resolveBaseUrl() {
  const explicit = process.env.SMOKE_BASE_URL?.trim();
  const candidates = explicit
    ? [explicit]
    : [
        'http://127.0.0.1:4173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
        'http://localhost:5173',
        'http://[::1]:4173',
        'http://[::1]:5173'
      ];

  for (const candidate of candidates) {
    try {
      const response = await fetch(`${candidate}/era-age`, {
        redirect: 'manual'
      });

      if (response.ok || response.status === 304) {
        return candidate;
      }
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error(
    'No running app server found at 127.0.0.1, localhost, or ::1 on ports 4173 / 5173. Start preview or dev, then rerun smoke.'
  );
}

async function captureFailure(page, name) {
  await ensureArtifacts();
  const safe = name.replace(/[^\w-]+/g, '-');
  await page.screenshot({
    path: path.join(artifactDir, `${safe}.png`),
    fullPage: true
  });
}

async function assertVisible(page, selector) {
  await page.locator(selector).first().waitFor({
    state: 'visible',
    timeout: 8000
  });
}

async function checkResponsiveWidth(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) {
    throw new Error(`Unexpected horizontal overflow detected: ${overflow}px`);
  }
}

async function runUxSmoke(browser, baseUrl) {
  for (const route of routeChecks) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 }
    });

    try {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
      await assertVisible(page, '.page-heading h2');

      for (const selector of route.selectors) {
        await assertVisible(page, selector);
      }

      console.log(`[smoke:ux] PASS ${route.path}`);
    } catch (error) {
      await captureFailure(page, `ux-${route.name}`);
      throw error;
    } finally {
      await page.close();
    }
  }

  const mobilePage = await browser.newPage({
    viewport: { width: 390, height: 1200 },
    isMobile: true,
    deviceScaleFactor: 2
  });

  try {
    await mobilePage.goto(`${baseUrl}/era-age`, { waitUntil: 'networkidle' });
    await assertVisible(mobilePage, '.tool-strip');
    await assertVisible(mobilePage, '.today-card');
    await checkResponsiveWidth(mobilePage);
    console.log('[smoke:ux] PASS mobile /era-age');
  } catch (error) {
    await captureFailure(mobilePage, 'ux-mobile-era-age');
    throw error;
  } finally {
    await mobilePage.close();
  }
}

async function runIoSmoke(browser, baseUrl) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 }
  });

  try {
    await page.goto(`${baseUrl}/era-age`, { waitUntil: 'networkidle' });

    await page.locator('.history-button').click();
    await assertVisible(page, '.history-drawer');
    await page.locator('.history-drawer .history-close-button').click();
    await page.locator('.history-drawer').waitFor({ state: 'hidden', timeout: 8000 });
    console.log('[smoke:io] PASS history drawer');

    await page.locator('.header-actions .header-icon-button').nth(1).click();
    await assertVisible(page, '.settings-drawer');
    await page.locator('.settings-drawer .settings-chip').first().click();
    await page.locator('.settings-drawer .history-close-button').click();
    await page.locator('.settings-drawer').waitFor({ state: 'hidden', timeout: 8000 });
    console.log('[smoke:io] PASS settings drawer');

    await page.goto(`${baseUrl}/length`, { waitUntil: 'networkidle' });
    const lengthInput = page.locator('.length-value-pill input');
    await lengthInput.fill('12345');
    await page.locator('.length-result-tile strong').first().waitFor({ state: 'visible', timeout: 8000 });
    console.log('[smoke:io] PASS length input');

    await page.goto(`${baseUrl}/currency`, { waitUntil: 'networkidle' });
    await assertVisible(page, '.currency-reference-card');
    await assertVisible(page, '.currency-update-button');
    console.log('[smoke:io] PASS currency reference');
  } catch (error) {
    await captureFailure(page, 'io-main');
    throw error;
  } finally {
    await page.close();
  }
}

async function main() {
  if (!['all', 'ux', 'io'].includes(requestedMode)) {
    throw new Error(`Unknown smoke mode "${requestedMode}". Use all, ux, or io.`);
  }

  const baseUrl = await resolveBaseUrl();
  const browser = await chromium.launch({ headless: true });

  try {
    if (requestedMode === 'all' || requestedMode === 'ux') {
      await runUxSmoke(browser, baseUrl);
    }

    if (requestedMode === 'all' || requestedMode === 'io') {
      await runIoSmoke(browser, baseUrl);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
