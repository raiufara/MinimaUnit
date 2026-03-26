import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY_SNAPSHOT,
  convertCurrency,
  formatCurrencyParts,
  getCurrencySnapshotAgeDays,
  loadStoredCurrencySnapshot,
  orderCurrencyUnits,
  saveCurrencySnapshot
} from '../src/lib/currency';
import { convertSpeed, formatSpeedCompact } from '../src/lib/speed';
import { installMockWindow, uninstallMockWindow } from './helpers/mockStorage';

describe('currency helpers', () => {
  beforeEach(() => {
    installMockWindow();
  });

  afterEach(() => {
    uninstallMockWindow();
  });

  it('converts currencies via the shared reference rates', () => {
    const usdFromEur = convertCurrency(1, 'eur', 'usd');
    expect(usdFromEur).toBe(DEFAULT_CURRENCY_SNAPSHOT.rates.usd);

    const jpyFromUsd = convertCurrency(1, 'usd', 'jpy');
    expect(jpyFromUsd).toBeCloseTo(
      DEFAULT_CURRENCY_SNAPSHOT.rates.jpy / DEFAULT_CURRENCY_SNAPSHOT.rates.usd,
      10
    );
  });

  it('formats currency values with adaptive precision and rounded metadata', () => {
    expect(formatCurrencyParts(183.636)).toEqual({
      text: '183.64',
      whole: '183',
      fraction: '64',
      rounded: true
    });

    expect(formatCurrencyParts(0.1234567)).toEqual({
      text: '0.123457',
      whole: '0',
      fraction: '123457',
      rounded: true
    });
  });

  it('stores, reloads, and ages snapshots', () => {
    expect(loadStoredCurrencySnapshot()).toBeNull();

    saveCurrencySnapshot(DEFAULT_CURRENCY_SNAPSHOT);
    expect(loadStoredCurrencySnapshot()).toEqual(DEFAULT_CURRENCY_SNAPSHOT);
    expect(window.localStorage.getItem(CURRENCY_STORAGE_KEY)).not.toBeNull();

    expect(getCurrencySnapshotAgeDays(DEFAULT_CURRENCY_SNAPSHOT, new Date('2026-03-23T00:00:00Z'))).toBeGreaterThanOrEqual(0);
  });

  it('orders currency units by a preferred ranking', () => {
    const ordered = orderCurrencyUnits(
      [
        { key: 'usd', label: 'USD', shortLabel: 'USD', displayLabel: 'USD', system: 'major', selectable: true },
        { key: 'jpy', label: 'JPY', shortLabel: 'JPY', displayLabel: 'JPY', system: 'major', selectable: true },
        { key: 'eur', label: 'EUR', shortLabel: 'EUR', displayLabel: 'EUR', system: 'major', selectable: true }
      ],
      ['jpy', 'usd', 'eur']
    );

    expect(ordered.map((unit) => unit.key)).toEqual(['jpy', 'usd', 'eur']);
  });
});

describe('speed helpers', () => {
  it('converts between everyday and scientific speed units', () => {
    expect(convertSpeed(1, 'mach', 'kmh')).toBeCloseTo(1235.52, 8);
    expect(convertSpeed(1, 'lightspeed', 'ms')).toBe(299792458);
    expect(convertSpeed(360, 'kmh', 'ms')).toBeCloseTo(100, 10);
  });

  it('compacts extremely large speed values for the light-speed view', () => {
    expect(formatSpeedCompact(1234)).toBe('1,234');
    expect(formatSpeedCompact(123456789)).not.toBe('123,456,789');
    expect(formatSpeedCompact(null)).toBe('-');
  });
});
