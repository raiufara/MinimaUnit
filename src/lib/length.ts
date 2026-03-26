import {
  formatMeasurementInput,
  formatMeasurementParts,
  parseMeasurementValue,
  sanitizeMeasurementInput,
  type MeasurementDisplayParts
} from './measurement';
import type { LengthUnit } from '../types';

export interface LengthUnitDefinition {
  key: LengthUnit;
  label: string;
  shortLabel: string;
  displayLabel: string;
  system: 'metric' | 'imperial' | 'traditional';
  meters: number;
  selectable: boolean;
}

export type LengthDisplayParts = MeasurementDisplayParts;

export const LENGTH_UNITS: LengthUnitDefinition[] = [
  { key: 'm', label: 'メートル', shortLabel: 'm', displayLabel: 'メートル (m)', system: 'metric', meters: 1, selectable: true },
  { key: 'cm', label: 'センチメートル', shortLabel: 'cm', displayLabel: 'センチメートル (cm)', system: 'metric', meters: 0.01, selectable: true },
  { key: 'mm', label: 'ミリメートル', shortLabel: 'mm', displayLabel: 'ミリメートル (mm)', system: 'metric', meters: 0.001, selectable: true },
  { key: 'km', label: 'キロメートル', shortLabel: 'km', displayLabel: 'キロメートル (km)', system: 'metric', meters: 1000, selectable: true },
  { key: 'in', label: 'インチ', shortLabel: 'in', displayLabel: 'インチ (in)', system: 'imperial', meters: 0.0254, selectable: true },
  { key: 'ft', label: 'フィート', shortLabel: 'ft', displayLabel: 'フィート (ft)', system: 'imperial', meters: 0.3048, selectable: true },
  { key: 'yd', label: 'ヤード', shortLabel: 'yd', displayLabel: 'ヤード (yd)', system: 'imperial', meters: 0.9144, selectable: true },
  { key: 'sun', label: '寸', shortLabel: 'sun', displayLabel: '寸 (Sun)', system: 'traditional', meters: 1 / 33, selectable: true },
  { key: 'shaku', label: '尺', shortLabel: 'shaku', displayLabel: '尺 (Shaku)', system: 'traditional', meters: 10 / 33, selectable: true },
  { key: 'ken', label: '間', shortLabel: 'ken', displayLabel: '間 (Ken)', system: 'traditional', meters: 60 / 33, selectable: false },
  { key: 'ri', label: '里', shortLabel: 'ri', displayLabel: '里 (Ri)', system: 'traditional', meters: 129600 / 33, selectable: true }
];

export const LENGTH_INPUT_UNITS = LENGTH_UNITS.filter((unit) => unit.selectable);

export const LENGTH_GROUPS = {
  metric: LENGTH_UNITS.filter((unit) => unit.system === 'metric'),
  imperial: LENGTH_UNITS.filter((unit) => unit.system === 'imperial'),
  traditional: LENGTH_UNITS.filter((unit) => unit.system === 'traditional')
} as const;

export function getLengthUnit(unitKey: LengthUnit): LengthUnitDefinition {
  return LENGTH_UNITS.find((unit) => unit.key === unitKey) ?? LENGTH_UNITS[0];
}

export function parseLengthValue(value: string): number | null {
  return parseMeasurementValue(value);
}

export function sanitizeLengthInput(value: string): string {
  return sanitizeMeasurementInput(value);
}

export function formatLengthInput(value: string): string {
  return formatMeasurementInput(value);
}

export function convertLength(value: number, fromUnit: LengthUnit, toUnit: LengthUnit): number {
  const from = getLengthUnit(fromUnit);
  const to = getLengthUnit(toUnit);
  return (value * from.meters) / to.meters;
}

export function formatLengthParts(value: number | null): LengthDisplayParts {
  return formatMeasurementParts(value);
}

export function formatLength(value: number | null): string {
  return formatLengthParts(value).text;
}
