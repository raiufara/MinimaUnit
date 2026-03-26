import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ECB_XML_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const CBC_USD_TWD_URL = 'https://www.cbc.gov.tw/en/lp-700-2-1-60.html';
const OUTPUT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'currency-rates.json');
const FETCH_TIMEOUT_MS = 12000;

const FALLBACK_SNAPSHOT = {
  version: 1,
  baseDate: '2026-03-11',
  label: '2026年3月11日',
  fetchedAt: '2026-03-11T15:18:00.000Z',
  sourceLabel: '同梱レート（ECB参考値 + 台湾中銀NT$/US$終値）',
  summary:
    'ECB公表の対ユーロ参考値を使用し、TWDは同日の台湾中銀NT$/US$終値から推定しています。実際の両替・決済レートとは異なる場合があります。',
  twdDerivedFrom: 'cbc-usd-cross',
  twdDate: '2026-03-11',
  rates: {
    jpy: 183.63,
    usd: 1.1581,
    eur: 1,
    cny: 7.9518,
    krw: 1710.64,
    twd: 36.775466,
    thb: 36.787,
    sgd: 1.4757,
    hkd: 9.0642,
    gbp: 0.86363,
    aud: 1.6195
  }
};

function formatDateLabel(dateText) {
  const [year, month, day] = dateText.split('-').map(Number);
  if (!year || !month || !day) {
    return dateText;
  }

  return `${year}年${month}月${day}日`;
}

function normalizeSnapshot(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const requiredUnits = ['jpy', 'usd', 'eur', 'cny', 'krw', 'twd', 'thb', 'sgd', 'hkd', 'gbp', 'aud'];
  const rates = candidate.rates;

  if (
    candidate.version !== 1 ||
    typeof candidate.baseDate !== 'string' ||
    typeof candidate.label !== 'string' ||
    typeof candidate.fetchedAt !== 'string' ||
    typeof candidate.sourceLabel !== 'string' ||
    typeof candidate.summary !== 'string' ||
    typeof candidate.twdDate !== 'string' ||
    (candidate.twdDerivedFrom !== 'cbc-usd-cross' && candidate.twdDerivedFrom !== 'stored-fallback') ||
    !rates ||
    !requiredUnits.every((unit) => typeof rates[unit] === 'number' && Number.isFinite(rates[unit]))
  ) {
    return null;
  }

  return candidate;
}

function parseEcbRates(xmlText) {
  const dateMatch = xmlText.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/);
  if (!dateMatch) {
    throw new Error('ECB_BASE_DATE_MISSING');
  }

  const parsedRates = new Map();
  const ratePattern = /currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g;
  let match;

  while ((match = ratePattern.exec(xmlText)) !== null) {
    parsedRates.set(match[1], Number(match[2]));
  }

  const requiredCodes = ['JPY', 'USD', 'CNY', 'KRW', 'THB', 'SGD', 'HKD', 'GBP', 'AUD'];
  if (!requiredCodes.every((code) => parsedRates.has(code))) {
    throw new Error('ECB_REQUIRED_RATE_MISSING');
  }

  return {
    baseDate: dateMatch[1],
    rates: {
      jpy: parsedRates.get('JPY'),
      usd: parsedRates.get('USD'),
      eur: 1,
      cny: parsedRates.get('CNY'),
      krw: parsedRates.get('KRW'),
      thb: parsedRates.get('THB'),
      sgd: parsedRates.get('SGD'),
      hkd: parsedRates.get('HKD'),
      gbp: parsedRates.get('GBP'),
      aud: parsedRates.get('AUD')
    }
  };
}

function parseCbcUsdTwd(htmlText) {
  const text = htmlText
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const anchorIndex = text.indexOf('Date NTD/USD');
  const targetText = anchorIndex >= 0 ? text.slice(anchorIndex) : text;
  const match = targetText.match(/(\d{4}\/\d{2}\/\d{2})\s+(\d{2}\.\d{3})/);

  if (!match) {
    throw new Error('CBC_USD_TWD_MISSING');
  }

  return {
    date: match[1].replace(/\//g, '-'),
    usdToTwd: Number(match[2])
  };
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`FETCH_FAILED_${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function readExistingSnapshot() {
  try {
    const raw = await readFile(OUTPUT_PATH, 'utf8');
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeSnapshot(snapshot) {
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
}

async function main() {
  const previousSnapshot = (await readExistingSnapshot()) ?? FALLBACK_SNAPSHOT;

  try {
    const ecbText = await fetchText(ECB_XML_URL);
    const ecbSnapshot = parseEcbRates(ecbText);

    let twdRate = previousSnapshot.rates.twd;
    let twdDate = previousSnapshot.twdDate;
    let twdDerivedFrom = 'stored-fallback';
    let sourceLabel = 'ECB参考レート（TWDは保存済みレート）';
    let summary =
      'ECB公表の対ユーロ参考値を使用しています。TWDは保存済みの参考値を継続しています。実際の両替・決済レートとは異なる場合があります。';

    try {
      const cbcText = await fetchText(CBC_USD_TWD_URL);
      const cbcRate = parseCbcUsdTwd(cbcText);
      twdRate = Number((ecbSnapshot.rates.usd * cbcRate.usdToTwd).toFixed(6));
      twdDate = cbcRate.date;
      twdDerivedFrom = 'cbc-usd-cross';
      sourceLabel = '同梱レート（ECB参考値 + 台湾中銀NT$/US$終値）';
      summary =
        'ECB公表の対ユーロ参考値を使用し、TWDは同日の台湾中銀NT$/US$終値から推定しています。実際の両替・決済レートとは異なる場合があります。';
    } catch (error) {
      console.warn(`[currency-rates] CBC fetch failed, keeping stored TWD: ${error instanceof Error ? error.message : String(error)}`);
    }

    const snapshot = {
      version: 1,
      baseDate: ecbSnapshot.baseDate,
      label: formatDateLabel(ecbSnapshot.baseDate),
      fetchedAt: new Date().toISOString(),
      sourceLabel,
      summary,
      twdDerivedFrom,
      twdDate,
      rates: {
        ...ecbSnapshot.rates,
        twd: twdRate
      }
    };

    await writeSnapshot(snapshot);
    console.log(`[currency-rates] Wrote ${snapshot.label} reference rates to ${OUTPUT_PATH}`);
  } catch (error) {
    await writeSnapshot(previousSnapshot);
    console.warn(
      `[currency-rates] Falling back to existing snapshot (${previousSnapshot.label}) because live fetch failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

main().catch(async (error) => {
  await writeSnapshot(FALLBACK_SNAPSHOT);
  console.error(`[currency-rates] Unhandled failure, wrote fallback snapshot: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 0;
});
