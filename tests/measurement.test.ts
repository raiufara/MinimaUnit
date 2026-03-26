import { describe, expect, it } from 'vitest';

import {
  formatMeasurementInput,
  formatMeasurementParts,
  parseMeasurementValue,
  sanitizeMeasurementInput
} from '../src/lib/measurement';

describe('measurement utilities', () => {
  it('sanitizes noisy numeric input into a stable decimal string', () => {
    expect(sanitizeMeasurementInput('abc-12..34xyz')).toBe('-12.34');
    expect(sanitizeMeasurementInput('-.')).toBe('-0.');
    expect(sanitizeMeasurementInput('')).toBe('');
  });

  it('formats input values with thousands separators', () => {
    expect(formatMeasurementInput('12345.67')).toBe('12,345.67');
    expect(formatMeasurementInput('-001234')).toBe('-1,234');
  });

  it('parses valid numeric values and rejects partial placeholders', () => {
    expect(parseMeasurementValue('1,234.5')).toBe(1234.5);
    expect(parseMeasurementValue('-0.25')).toBe(-0.25);
    expect(parseMeasurementValue('-')).toBeNull();
    expect(parseMeasurementValue('abc')).toBeNull();
  });

  it('formats display parts with adaptive rounding', () => {
    expect(formatMeasurementParts(null)).toEqual({
      text: '-',
      whole: '-',
      fraction: '',
      rounded: false
    });

    expect(formatMeasurementParts(12.345678)).toEqual({
      text: '12.3457',
      whole: '12',
      fraction: '3457',
      rounded: true
    });

    expect(formatMeasurementParts(1234.567)).toEqual({
      text: '1,235',
      whole: '1,235',
      fraction: '',
      rounded: true
    });
  });
});
