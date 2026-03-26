import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve('artifacts', 'layout-check');

const routeChecks = [
  { name: 'era-age', path: '/era-age' },
  { name: 'length', path: '/length' },
  { name: 'currency', path: '/currency' }
];

const viewports = [
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'narrow', width: 1100, height: 1100 },
  { name: 'mobile', width: 390, height: 1200, isMobile: true }
];

async function ensureOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
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
    'No running app server found at 127.0.0.1, localhost, or ::1 on ports 4173 / 5173. Start preview or dev, then rerun layout-check.'
  );
}

async function capture() {
  await ensureOutputDir();
  const baseUrl = await resolveBaseUrl();
  const browser = await chromium.launch({ headless: true });

  try {
    for (const route of routeChecks) {
      for (const viewport of viewports) {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.isMobile ?? false,
          deviceScaleFactor: viewport.isMobile ? 2 : 1
        });

        await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
        await page.screenshot({
          path: path.join(outputDir, `${route.name}-${viewport.name}.png`),
          fullPage: true
        });
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

capture().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
