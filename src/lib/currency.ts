import generatedCurrencyRates from '../data/currency-rates.json';
import {
  formatMeasurementInput,
  parseMeasurementValue,
  sanitizeMeasurementInput,
  type MeasurementDisplayParts
} from './measurement';
import type { CurrencyMode, CurrencyUnit } from '../types';

export interface CurrencyUnitDefinition {
  key: CurrencyUnit;
  label: string;
  shortLabel: string;
  displayLabel: string;
  system: 'major' | 'asia' | 'global';
  selectable: boolean;
}

export interface CurrencyModeDefinition {
  key: CurrencyMode;
  label: string;
  description: string;
  unitOrder: {
    major: CurrencyUnit[];
    asia: CurrencyUnit[];
    global: CurrencyUnit[];
  };
}

export interface CurrencyRatesSnapshot {
  version: 1;
  baseDate: string;
  label: string;
  fetchedAt: string;
  sourceLabel: string;
  summary: string;
  twdDerivedFrom: 'cbc-usd-cross' | 'stored-fallback';
  twdDate: string;
  rates: Record<CurrencyUnit, number>;
}

export type CurrencyDisplayParts = MeasurementDisplayParts;

export const CURRENCY_STORAGE_KEY = 'unit-helper:currency-rates:v1';
export const CURRENCY_UPDATE_COOLDOWN_MS = 5 * 60 * 1000;

const FALLBACK_RATES: Record<CurrencyUnit, number> = {
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
};

const FALLBACK_CURRENCY_SNAPSHOT: CurrencyRatesSnapshot = {
  version: 1,
  baseDate: '2026-03-11',
  label: '2026年3月11日',
  fetchedAt: '2026-03-11T15:18:00.000Z',
  sourceLabel: '同梱レート（ECB参考値 + 台湾中銀NT$/US$終値）',
  summary:
    'ECB公表の対ユーロ参考値を使用し、TWDは同日の台湾中銀NT$/US$終値から推定しています。実際の両替・決済レートとは異なる場合があります。',
  twdDerivedFrom: 'cbc-usd-cross',
  twdDate: '2026-03-11',
  rates: FALLBACK_RATES
};

export const CURRENCY_ROUNDING_NOTE =
  '見やすさのため、一部の金額は小数点以下を丸めて表示しています（1未満は小数第6位まで、1以上100未満は第4位まで、100以上は第2位まで）。';

export const CURRENCY_UNITS: CurrencyUnitDefinition[] = [
  { key: 'jpy', label: '日本円', shortLabel: 'JPY', displayLabel: '日本円 (JPY)', system: 'major', selectable: true },
  { key: 'usd', label: '米ドル', shortLabel: 'USD', displayLabel: '米ドル (USD)', system: 'major', selectable: true },
  { key: 'eur', label: 'ユーロ', shortLabel: 'EUR', displayLabel: 'ユーロ (EUR)', system: 'major', selectable: true },
  { key: 'cny', label: '人民元', shortLabel: 'CNY', displayLabel: '人民元 (CNY)', system: 'asia', selectable: true },
  { key: 'krw', label: '韓国ウォン', shortLabel: 'KRW', displayLabel: '韓国ウォン (KRW)', system: 'asia', selectable: true },
  { key: 'twd', label: '台湾ドル', shortLabel: 'TWD', displayLabel: '台湾ドル (TWD)', system: 'asia', selectable: true },
  { key: 'thb', label: 'タイバーツ', shortLabel: 'THB', displayLabel: 'タイバーツ (THB)', system: 'asia', selectable: true },
  { key: 'sgd', label: 'シンガポールドル', shortLabel: 'SGD', displayLabel: 'シンガポールドル (SGD)', system: 'asia', selectable: true },
  { key: 'hkd', label: '香港ドル', shortLabel: 'HKD', displayLabel: '香港ドル (HKD)', system: 'asia', selectable: true },
  { key: 'gbp', label: '英ポンド', shortLabel: 'GBP', displayLabel: '英ポンド (GBP)', system: 'global', selectable: true },
  { key: 'aud', label: '豪ドル', shortLabel: 'AUD', displayLabel: '豪ドル (AUD)', system: 'global', selectable: true }
];

export const CURRENCY_INPUT_UNITS = CURRENCY_UNITS.filter((unit) => unit.selectable);

export const CURRENCY_GROUPS = {
  major: CURRENCY_UNITS.filter((unit) => unit.system === 'major'),
  asia: CURRENCY_UNITS.filter((unit) => unit.system === 'asia'),
  global: CURRENCY_UNITS.filter((unit) => unit.system === 'global')
} as const;

export const CURRENCY_MODES: CurrencyModeDefinition[] = [
  {
    key: 'standard',
    label: '標準',
    description: '日常比較向けです。日本円・米ドル・ユーロを軸に表示します。',
    unitOrder: {
      major: ['jpy', 'usd', 'eur'],
      asia: ['cny', 'krw', 'twd', 'thb', 'sgd', 'hkd'],
      global: ['gbp', 'aud']
    }
  },
  {
    key: 'travel',
    label: '旅行',
    description: '旅行・出張向けです。近距離圏の通貨を優先して表示します。',
    unitOrder: {
      major: ['jpy', 'usd', 'eur'],
      asia: ['twd', 'thb', 'krw', 'hkd', 'sgd', 'cny'],
      global: ['aud', 'gbp']
    }
  },
  {
    key: 'business',
    label: '業務',
    description: '業務比較向けです。米ドル・ユーロ・人民元まわりを優先して表示します。',
    unitOrder: {
      major: ['jpy', 'usd', 'eur'],
      asia: ['cny', 'sgd', 'hkd', 'krw', 'twd', 'thb'],
      global: ['gbp', 'aud']
    }
  }
] as const;

function formatCurrencyDateLabel(dateText: string): string {
  const [year, month, day] = dateText.split('-').map(Number);
  if (!year || !month || !day) {
    return dateText;
  }

  return `${year}年${month}月${day}日`;
}

function normalizeCurrencySnapshot(candidate: unknown): CurrencyRatesSnapshot | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const snapshot = candidate as Partial<CurrencyRatesSnapshot>;
  if (
    snapshot.version !== 1 ||
    typeof snapshot.baseDate !== 'string' ||
    typeof snapshot.label !== 'string' ||
    typeof snapshot.fetchedAt !== 'string' ||
    typeof snapshot.sourceLabel !== 'string' ||
    typeof snapshot.summary !== 'string' ||
    typeof snapshot.twdDate !== 'string' ||
    (snapshot.twdDerivedFrom !== 'cbc-usd-cross' && snapshot.twdDerivedFrom !== 'stored-fallback') ||
    !snapshot.rates
  ) {
    return null;
  }

  const requiredUnits: CurrencyUnit[] = ['jpy', 'usd', 'eur', 'cny', 'krw', 'twd', 'thb', 'sgd', 'hkd', 'gbp', 'aud'];
  const rates = snapshot.rates as Partial<Record<CurrencyUnit, number>>;

  if (!requiredUnits.every((unit) => typeof rates[unit] === 'number' && Number.isFinite(rates[unit] as number))) {
    return null;
  }

  return snapshot as CurrencyRatesSnapshot;
}

export const DEFAULT_CURRENCY_SNAPSHOT: CurrencyRatesSnapshot =
  normalizeCurrencySnapshot(generatedCurrencyRates) ?? FALLBACK_CURRENCY_SNAPSHOT;

export const CURRENCY_REFERENCE = DEFAULT_CURRENCY_SNAPSHOT;

function parseEcbRates(xmlText: string): { baseDate: string; rates: Omit<Record<CurrencyUnit, number>, 'twd'> } {
  const dateMatch = xmlText.match(/time=['"](\d{4}-\d{2}-\d{2})['"]/);
  if (!dateMatch) {
    throw new Error('ECB_BASE_DATE_MISSING');
  }

  const parsedRates = new Map<string, number>();
  const ratePattern = /currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = ratePattern.exec(xmlText)) !== null) {
    parsedRates.set(match[1], Number(match[2]));
  }

  const requiredCodes = ['JPY', 'USD', 'CNY', 'KRW', 'THB', 'SGD', 'HKD', 'GBP', 'AUD'] as const;
  if (!requiredCodes.every((code) => parsedRates.has(code))) {
    throw new Error('ECB_REQUIRED_RATE_MISSING');
  }

  return {
    baseDate: dateMatch[1],
    rates: {
      jpy: parsedRates.get('JPY') as number,
      usd: parsedRates.get('USD') as number,
      eur: 1,
      cny: parsedRates.get('CNY') as number,
      krw: parsedRates.get('KRW') as number,
      thb: parsedRates.get('THB') as number,
      sgd: parsedRates.get('SGD') as number,
      hkd: parsedRates.get('HKD') as number,
      gbp: parsedRates.get('GBP') as number,
      aud: parsedRates.get('AUD') as number
    }
  };
}

function parseCbcUsdTwd(htmlText: string): { date: string; usdToTwd: number } {
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

export function loadStoredCurrencySnapshot(): CurrencyRatesSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return normalizeCurrencySnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCurrencySnapshot(snapshot: CurrencyRatesSnapshot): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage failures and keep runtime snapshot only.
  }
}

export async function fetchLatestCurrencySnapshot(
  previousSnapshot: CurrencyRatesSnapshot = DEFAULT_CURRENCY_SNAPSHOT
): Promise<CurrencyRatesSnapshot> {
  const ecbResponse = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', {
    cache: 'no-store'
  });

  if (!ecbResponse.ok) {
    throw new Error(`ECB_FETCH_FAILED_${ecbResponse.status}`);
  }

  const ecbText = await ecbResponse.text();
  const ecbSnapshot = parseEcbRates(ecbText);

  let twdRate = previousSnapshot.rates.twd ?? DEFAULT_CURRENCY_SNAPSHOT.rates.twd;
  let twdDate = previousSnapshot.twdDate ?? previousSnapshot.baseDate;
  let twdDerivedFrom: CurrencyRatesSnapshot['twdDerivedFrom'] = 'stored-fallback';
  let sourceLabel = 'ECB参考レート（TWDは保存済みレート）';
  let summary =
    'ECB公表の対ユーロ参考値を使用しています。TWDは保存済みの参考値を継続しています。実際の両替・決済レートとは異なる場合があります。';

  try {
    const cbcResponse = await fetch('https://www.cbc.gov.tw/en/lp-700-2-1-60.html', {
      cache: 'no-store'
    });

    if (!cbcResponse.ok) {
      throw new Error(`CBC_FETCH_FAILED_${cbcResponse.status}`);
    }

    const cbcText = await cbcResponse.text();
    const cbcRate = parseCbcUsdTwd(cbcText);
    twdRate = Number((ecbSnapshot.rates.usd * cbcRate.usdToTwd).toFixed(6));
    twdDate = cbcRate.date;
    twdDerivedFrom = 'cbc-usd-cross';
    sourceLabel = 'ECB参考レート + 台湾中銀NT$/US$終値';
    summary =
      'ECB公表の対ユーロ参考値を使用し、TWDは台湾中銀のNT$/US$終値から推定しています。実際の両替・決済レートとは異なる場合があります。';
  } catch {
    // Keep stored TWD rate if CBC access fails.
  }

  return {
    version: 1,
    baseDate: ecbSnapshot.baseDate,
    label: formatCurrencyDateLabel(ecbSnapshot.baseDate),
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
}

export function getCurrencySnapshotAgeDays(snapshot: CurrencyRatesSnapshot, now = new Date()): number {
  const [year, month, day] = snapshot.baseDate.split('-').map(Number);
  if (!year || !month || !day) {
    return 0;
  }

  const snapshotUtc = Date.UTC(year, month - 1, day);
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((nowUtc - snapshotUtc) / 86400000));
}

export function getCurrencyUnit(unitKey: CurrencyUnit): CurrencyUnitDefinition {
  return CURRENCY_UNITS.find((unit) => unit.key === unitKey) ?? CURRENCY_UNITS[0];
}

export function getCurrencyMode(modeKey: CurrencyMode): CurrencyModeDefinition {
  return CURRENCY_MODES.find((mode) => mode.key === modeKey) ?? CURRENCY_MODES[0];
}

export function orderCurrencyUnits(units: CurrencyUnitDefinition[], order: CurrencyUnit[]): CurrencyUnitDefinition[] {
  const rank = new Map(order.map((unit, index) => [unit, index]));
  return [...units].sort((left, right) => (rank.get(left.key) ?? Number.MAX_SAFE_INTEGER) - (rank.get(right.key) ?? Number.MAX_SAFE_INTEGER));
}

export function parseCurrencyValue(value: string): number | null {
  return parseMeasurementValue(value);
}

export function sanitizeCurrencyInput(value: string): string {
  return sanitizeMeasurementInput(value);
}

export function formatCurrencyInput(value: string): string {
  return formatMeasurementInput(value);
}

export function convertCurrency(
  value: number,
  fromUnit: CurrencyUnit,
  toUnit: CurrencyUnit,
  rates: Record<CurrencyUnit, number> = DEFAULT_CURRENCY_SNAPSHOT.rates
): number {
  return (value / rates[fromUnit]) * rates[toUnit];
}

function getMaximumFractionDigits(value: number): number {
  const abs = Math.abs(value);
  return abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
}

export function formatCurrencyParts(value: number | null): CurrencyDisplayParts {
  if (value === null) {
    return {
      text: '-',
      whole: '-',
      fraction: '',
      rounded: false
    };
  }

  const maximumFractionDigits = getMaximumFractionDigits(value);
  const roundedValue = Number(value.toFixed(maximumFractionDigits));
  const text = roundedValue.toLocaleString('ja-JP', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  });
  const [whole, fraction = ''] = text.split('.');
  const tolerance = Math.max(1e-12, Math.abs(value) * 1e-10);

  return {
    text,
    whole,
    fraction,
    rounded: Math.abs(value - roundedValue) > tolerance
  };
}
