import {
  formatMeasurementInput,
  formatMeasurementParts,
  parseMeasurementValue,
  sanitizeMeasurementInput,
  type MeasurementDisplayParts
} from './measurement';
import type { AreaMode, AreaUnit } from '../types';

export interface AreaUnitDefinition {
  key: AreaUnit;
  label: string;
  shortLabel: string;
  displayLabel: string;
  system: 'metric' | 'imperial' | 'traditional';
  squareMeters: number;
  selectable: boolean;
}

export type AreaDisplayParts = MeasurementDisplayParts;

export interface AreaModeDefinition {
  key: AreaMode;
  label: string;
  description: string;
  unitOrder: {
    metric: AreaUnit[];
    imperial: AreaUnit[];
    traditional: AreaUnit[];
  };
}

export const AREA_UNITS: AreaUnitDefinition[] = [
  { key: 'sqm', label: '平方メートル', shortLabel: 'm²', displayLabel: '平方メートル (m²)', system: 'metric', squareMeters: 1, selectable: true },
  { key: 'sqcm', label: '平方センチ', shortLabel: 'cm²', displayLabel: '平方センチメートル (cm²)', system: 'metric', squareMeters: 0.0001, selectable: true },
  { key: 'sqkm', label: '平方キロ', shortLabel: 'km²', displayLabel: '平方キロメートル (km²)', system: 'metric', squareMeters: 1_000_000, selectable: true },
  { key: 'ha', label: 'ヘクタール', shortLabel: 'ha', displayLabel: 'ヘクタール (ha)', system: 'metric', squareMeters: 10_000, selectable: true },
  { key: 'sqin', label: '平方インチ', shortLabel: 'in²', displayLabel: '平方インチ (in²)', system: 'imperial', squareMeters: 0.00064516, selectable: true },
  { key: 'sqft', label: '平方フィート', shortLabel: 'ft²', displayLabel: '平方フィート (ft²)', system: 'imperial', squareMeters: 0.09290304, selectable: true },
  { key: 'sqyd', label: '平方ヤード', shortLabel: 'yd²', displayLabel: '平方ヤード (yd²)', system: 'imperial', squareMeters: 0.83612736, selectable: true },
  { key: 'acre', label: 'エーカー', shortLabel: 'acre', displayLabel: 'エーカー (acre)', system: 'imperial', squareMeters: 4046.8564224, selectable: true },
  { key: 'tsubo', label: '坪', shortLabel: '坪', displayLabel: '坪 (Tsubo)', system: 'traditional', squareMeters: 400 / 121, selectable: true },
  { key: 'se', label: '畝', shortLabel: '畝', displayLabel: '畝 (Se)', system: 'traditional', squareMeters: (400 / 121) * 30, selectable: true },
  { key: 'tan', label: '反', shortLabel: '反', displayLabel: '反 (Tan)', system: 'traditional', squareMeters: (400 / 121) * 300, selectable: true },
  { key: 'cho', label: '町', shortLabel: '町', displayLabel: '町 (Cho)', system: 'traditional', squareMeters: (400 / 121) * 3000, selectable: true }
];

export const AREA_INPUT_UNITS = AREA_UNITS.filter((unit) => unit.selectable);

export const AREA_GROUPS = {
  metric: AREA_UNITS.filter((unit) => unit.system === 'metric'),
  imperial: AREA_UNITS.filter((unit) => unit.system === 'imperial'),
  traditional: AREA_UNITS.filter((unit) => unit.system === 'traditional')
} as const;

export const AREA_MODES: AreaModeDefinition[] = [
  {
    key: 'standard',
    label: '標準',
    description: '日常比較向けです。㎡・坪・平方フィート を優先して表示します。',
    unitOrder: {
      metric: ['sqm', 'ha', 'sqkm', 'sqcm'],
      imperial: ['sqft', 'sqyd', 'acre', 'sqin'],
      traditional: ['tsubo', 'se', 'tan', 'cho']
    }
  },
  {
    key: 'real-estate',
    label: '不動産',
    description: '不動産向けです。㎡・坪・平方フィート・エーカー を優先して表示します。',
    unitOrder: {
      metric: ['sqm', 'ha', 'sqkm', 'sqcm'],
      imperial: ['sqft', 'acre', 'sqyd', 'sqin'],
      traditional: ['tsubo', 'tan', 'se', 'cho']
    }
  },
  {
    key: 'farmland',
    label: '農地',
    description: '農地向けです。ha・反・畝・町・acre を優先して表示します。',
    unitOrder: {
      metric: ['ha', 'sqm', 'sqkm', 'sqcm'],
      imperial: ['acre', 'sqft', 'sqyd', 'sqin'],
      traditional: ['tan', 'se', 'cho', 'tsubo']
    }
  }
] as const;

export function getAreaUnit(unitKey: AreaUnit): AreaUnitDefinition {
  return AREA_UNITS.find((unit) => unit.key === unitKey) ?? AREA_UNITS[0];
}

export function getAreaMode(modeKey: AreaMode): AreaModeDefinition {
  return AREA_MODES.find((mode) => mode.key === modeKey) ?? AREA_MODES[0];
}

export function orderAreaUnits(units: AreaUnitDefinition[], order: AreaUnit[]): AreaUnitDefinition[] {
  const rank = new Map(order.map((unit, index) => [unit, index]));
  return [...units].sort((left, right) => (rank.get(left.key) ?? Number.MAX_SAFE_INTEGER) - (rank.get(right.key) ?? Number.MAX_SAFE_INTEGER));
}

export function parseAreaValue(value: string): number | null {
  return parseMeasurementValue(value);
}

export function sanitizeAreaInput(value: string): string {
  return sanitizeMeasurementInput(value);
}

export function formatAreaInput(value: string): string {
  return formatMeasurementInput(value);
}

export function convertArea(value: number, fromUnit: AreaUnit, toUnit: AreaUnit): number {
  const from = getAreaUnit(fromUnit);
  const to = getAreaUnit(toUnit);
  return (value * from.squareMeters) / to.squareMeters;
}

export function formatAreaParts(value: number | null): AreaDisplayParts {
  return formatMeasurementParts(value);
}

export function formatArea(value: number | null): string {
  return formatAreaParts(value).text;
}
