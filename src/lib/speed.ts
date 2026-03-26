import {
  formatMeasurementInput,
  formatMeasurementParts,
  parseMeasurementValue,
  sanitizeMeasurementInput,
  type MeasurementDisplayParts
} from './measurement';
import type { SpeedUnit } from '../types';

export interface SpeedUnitDefinition {
  key: SpeedUnit;
  label: string;
  shortLabel: string;
  displayLabel: string;
  system: 'everyday' | 'specialized';
  metersPerSecond: number;
}

export type SpeedDisplayParts = MeasurementDisplayParts;

export const SPEED_UNITS: SpeedUnitDefinition[] = [
  { key: 'kmh', label: 'キロ毎時', shortLabel: 'km/h', displayLabel: 'キロ毎時 (km/h)', system: 'everyday', metersPerSecond: 1000 / 3600 },
  { key: 'ms', label: 'メートル毎秒', shortLabel: 'm/s', displayLabel: 'メートル毎秒 (m/s)', system: 'everyday', metersPerSecond: 1 },
  { key: 'mph', label: 'マイル毎時', shortLabel: 'mph', displayLabel: 'マイル毎時 (mph)', system: 'everyday', metersPerSecond: 1609.344 / 3600 },
  { key: 'knot', label: 'ノット', shortLabel: 'kt', displayLabel: 'ノット (kt)', system: 'specialized', metersPerSecond: 1852 / 3600 },
  { key: 'fts', label: 'フィート毎秒', shortLabel: 'ft/s', displayLabel: 'フィート毎秒 (ft/s)', system: 'specialized', metersPerSecond: 0.3048 },
  { key: 'mach', label: '音速', shortLabel: 'Mach', displayLabel: '音速 (Mach 1)', system: 'specialized', metersPerSecond: 343.2 },
  { key: 'lightspeed', label: '光速', shortLabel: 'c', displayLabel: '光速 (c)', system: 'specialized', metersPerSecond: 299792458 }
];

export const SPEED_GROUPS = {
  everyday: SPEED_UNITS.filter((unit) => unit.system === 'everyday'),
  specialized: SPEED_UNITS.filter((unit) => unit.system === 'specialized')
} as const;

export const SPEED_INPUT_UNITS = SPEED_UNITS;

export function getSpeedUnit(unitKey: SpeedUnit): SpeedUnitDefinition {
  return SPEED_UNITS.find((unit) => unit.key === unitKey) ?? SPEED_UNITS[0];
}

export function parseSpeedValue(value: string): number | null {
  return parseMeasurementValue(value);
}

export function sanitizeSpeedInput(value: string): string {
  return sanitizeMeasurementInput(value);
}

export function formatSpeedInput(value: string): string {
  return formatMeasurementInput(value);
}

export function convertSpeed(value: number, fromUnit: SpeedUnit, toUnit: SpeedUnit): number {
  const from = getSpeedUnit(fromUnit);
  const to = getSpeedUnit(toUnit);
  return (value * from.metersPerSecond) / to.metersPerSecond;
}

export function formatSpeedParts(value: number | null): SpeedDisplayParts {
  return formatMeasurementParts(value);
}

export function formatSpeedCompact(value: number | null): string {
  if (value === null) {
    return '-';
  }

  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (abs >= 1e12) {
    return `${sign}${(abs / 1e12).toLocaleString('ja-JP', { maximumFractionDigits: 2 })}兆`;
  }

  if (abs >= 1e8) {
    return `${sign}${(abs / 1e8).toLocaleString('ja-JP', { maximumFractionDigits: 2 })}億`;
  }

  if (abs >= 1e4) {
    return `${sign}${(abs / 1e4).toLocaleString('ja-JP', { maximumFractionDigits: 2 })}万`;
  }

  return formatMeasurementParts(value).text;
}
