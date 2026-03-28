import { describe, expect, it } from 'vitest';

import {
  calculateAge,
  computeEraAgeResult,
  deriveAgeModeBaseDate,
  deriveAgeModeTargetDate,
  getEraPeriodLabels,
  getZodiac,
  normalizeDateInput,
  normalizeToGregorian
} from '../src/lib/era';
import type { DateInput } from '../src/types';

function gregorianDate(year: number, month: number, day: number): DateInput {
  return {
    era: 'gregorian',
    year,
    month,
    day,
    granularity: 'date'
  };
}

describe('era-age conversions', () => {
  it('normalizes reiwa and old heisei notation correctly', () => {
    expect(
      normalizeToGregorian({
        era: 'reiwa',
        year: 1,
        month: 5,
        day: 1,
        granularity: 'date'
      })
    ).toEqual({
      gregorianYear: 2019,
      warnings: [],
      errors: []
    });

    const legacyHeisei = normalizeToGregorian({
      era: 'heisei',
      year: 32,
      month: 1,
      day: 1,
      granularity: 'date'
    });
    expect(legacyHeisei.gregorianYear).toBe(2020);
    expect(legacyHeisei.errors).toHaveLength(0);
    expect(legacyHeisei.warnings).toHaveLength(1);
  });

  it('accepts Meiji 1 from the converted Gregorian start date', () => {
    const result = normalizeDateInput({
      era: 'meiji',
      year: 1,
      month: 1,
      day: 23,
      granularity: 'date'
    });

    expect(result.gregorianYear).toBe(1868);
    expect(result.gregorianDate).toEqual(new Date(1868, 0, 23));
    expect(result.errors).toHaveLength(0);
  });

  it('rejects unsupported dates before the supported Gregorian range', () => {
    const result = normalizeDateInput({
      era: 'meiji',
      year: 1,
      month: 1,
      day: 22,
      granularity: 'date'
    });

    expect(result.gregorianYear).toBeNull();
    expect(result.gregorianDate).toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toBe('1868年1月23日より前は未対応です。');
  });

  it('calculates full age only for date-granularity inputs', () => {
    expect(calculateAge(gregorianDate(2000, 4, 1), gregorianDate(2026, 3, 15))).toBe(25);

    expect(
      calculateAge(
        { era: 'gregorian', year: 2000, granularity: 'year' },
        { era: 'gregorian', year: 2026, granularity: 'year' }
      )
    ).toBeNull();
  });

  it('derives age-mode companion dates in both directions', () => {
    expect(deriveAgeModeBaseDate(gregorianDate(2026, 3, 22), 25)).toEqual({
      era: 'gregorian',
      year: 2001,
      month: 3,
      day: 22,
      granularity: 'date'
    });

    expect(deriveAgeModeTargetDate(gregorianDate(2001, 3, 22), 25)).toEqual({
      era: 'gregorian',
      year: 2026,
      month: 3,
      day: 22,
      granularity: 'date'
    });
  });

  it('computes year-only durations while keeping warnings and zodiac', () => {
    const result = computeEraAgeResult(
      { era: 'heisei', year: 12, granularity: 'year' },
      { era: 'reiwa', year: 8, granularity: 'year' }
    );

    expect(result.age).toBe(26);
    expect(result.duration.years).toBe(26);
    expect(result.duration.totalMonths).toBe(312);
    expect(result.duration.days).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(0);
  });

  it('returns zodiac values from Gregorian years', () => {
    expect(getZodiac(2000)).toMatchObject({
      stem: '庚',
      branch: '辰',
      eto: '庚辰'
    });

    expect(getZodiac(null)).toEqual({
      stem: null,
      branch: null,
      eto: null,
      ruby: null
    });
  });

  it('returns formatted era period labels', () => {
    expect(getEraPeriodLabels()).toContain('明治：1868年1月23日 〜 1912年7月29日');
    expect(getEraPeriodLabels()).toContain('大正：1912年7月30日 〜 1926年12月24日');
    expect(getEraPeriodLabels()).toContain('令和：2019年5月1日 〜 ');
  });
});
