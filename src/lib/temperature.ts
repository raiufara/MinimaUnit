import {
  formatMeasurementInput,
  formatMeasurementParts,
  parseMeasurementValue,
  sanitizeMeasurementInput,
  type MeasurementDisplayParts
} from './measurement';
import type { TemperatureUnit } from '../types';

export interface TemperatureUnitDefinition {
  key: TemperatureUnit;
  label: string;
  shortLabel: string;
  displayLabel: string;
  system: 'daily' | 'scientific';
}

export type TemperatureDisplayParts = MeasurementDisplayParts;

export const TEMPERATURE_UNITS: TemperatureUnitDefinition[] = [
  { key: 'c', label: '摂氏', shortLabel: '°C', displayLabel: '摂氏 (°C)', system: 'daily' },
  { key: 'f', label: '華氏', shortLabel: '°F', displayLabel: '華氏 (°F)', system: 'daily' },
  { key: 'k', label: 'ケルビン', shortLabel: 'K', displayLabel: 'ケルビン (K)', system: 'scientific' },
  { key: 'r', label: 'ランキン', shortLabel: '°R', displayLabel: 'ランキン (°R)', system: 'scientific' }
];

export const TEMPERATURE_GROUPS = {
  daily: TEMPERATURE_UNITS.filter((unit) => unit.system === 'daily'),
  scientific: TEMPERATURE_UNITS.filter((unit) => unit.system === 'scientific')
} as const;

export const TEMPERATURE_INPUT_UNITS = TEMPERATURE_UNITS;

export function getTemperatureUnit(unitKey: TemperatureUnit): TemperatureUnitDefinition {
  return TEMPERATURE_UNITS.find((unit) => unit.key === unitKey) ?? TEMPERATURE_UNITS[0];
}

export function parseTemperatureValue(value: string): number | null {
  return parseMeasurementValue(value);
}

export function sanitizeTemperatureInput(value: string): string {
  return sanitizeMeasurementInput(value);
}

export function formatTemperatureInput(value: string): string {
  return formatMeasurementInput(value);
}

function toCelsius(value: number, fromUnit: TemperatureUnit): number {
  switch (fromUnit) {
    case 'c':
      return value;
    case 'f':
      return ((value - 32) * 5) / 9;
    case 'k':
      return value - 273.15;
    case 'r':
      return ((value - 491.67) * 5) / 9;
    default:
      return value;
  }
}

function fromCelsius(value: number, toUnit: TemperatureUnit): number {
  switch (toUnit) {
    case 'c':
      return value;
    case 'f':
      return (value * 9) / 5 + 32;
    case 'k':
      return value + 273.15;
    case 'r':
      return (value + 273.15) * (9 / 5);
    default:
      return value;
  }
}

export function convertTemperature(value: number, fromUnit: TemperatureUnit, toUnit: TemperatureUnit): number {
  if (fromUnit === toUnit) {
    return value;
  }

  return fromCelsius(toCelsius(value, fromUnit), toUnit);
}

export function validateTemperatureInput(value: number | null, unit: TemperatureUnit): string[] {
  if (value === null) {
    return [];
  }

  if ((unit === 'k' || unit === 'r') && value < 0) {
    return ['ケルビンとランキンは 0 未満を入力できません。'];
  }

  return [];
}

export function formatTemperatureParts(value: number | null): TemperatureDisplayParts {
  return formatMeasurementParts(value);
}
