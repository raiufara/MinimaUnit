import {
  formatMeasurementInput,
  formatMeasurementParts,
  parseMeasurementValue,
  sanitizeMeasurementInput,
  type MeasurementDisplayParts
} from './measurement';
import type { WeightMode, WeightUnit } from '../types';

export interface WeightUnitDefinition {
  key: WeightUnit;
  label: string;
  shortLabel: string;
  displayLabel: string;
  system: 'metric' | 'imperial' | 'traditional';
  kilograms: number;
  selectable: boolean;
}

export type WeightDisplayParts = MeasurementDisplayParts;

export interface WeightModeDefinition {
  key: WeightMode;
  label: string;
  description: string;
  unitOrder: {
    metric: WeightUnit[];
    imperial: WeightUnit[];
    traditional: WeightUnit[];
  };
}

export const WEIGHT_UNITS: WeightUnitDefinition[] = [
  { key: 't', label: 'トン', shortLabel: 't', displayLabel: 'トン (t)', system: 'metric', kilograms: 1000, selectable: true },
  { key: 'kg', label: 'キログラム', shortLabel: 'kg', displayLabel: 'キログラム (kg)', system: 'metric', kilograms: 1, selectable: true },
  { key: 'g', label: 'グラム', shortLabel: 'g', displayLabel: 'グラム (g)', system: 'metric', kilograms: 0.001, selectable: true },
  { key: 'mg', label: 'ミリグラム', shortLabel: 'mg', displayLabel: 'ミリグラム (mg)', system: 'metric', kilograms: 0.000001, selectable: true },
  { key: 'lb', label: 'ポンド', shortLabel: 'lb', displayLabel: 'ポンド (lb)', system: 'imperial', kilograms: 0.45359237, selectable: true },
  { key: 'oz', label: 'オンス', shortLabel: 'oz', displayLabel: 'オンス (oz)', system: 'imperial', kilograms: 0.028349523125, selectable: true },
  { key: 'st', label: 'ストーン', shortLabel: 'st', displayLabel: 'ストーン (st)', system: 'imperial', kilograms: 6.35029318, selectable: true },
  { key: 'momme', label: '匁', shortLabel: 'momme', displayLabel: '匁 (Momme)', system: 'traditional', kilograms: 0.00375, selectable: true },
  { key: 'ryo', label: '両', shortLabel: 'ryo', displayLabel: '両 (Ryo)', system: 'traditional', kilograms: 0.0375, selectable: true },
  { key: 'kin', label: '斤', shortLabel: 'kin', displayLabel: '斤 (Kin)', system: 'traditional', kilograms: 0.6, selectable: true },
  { key: 'kan', label: '貫', shortLabel: 'kan', displayLabel: '貫 (Kan)', system: 'traditional', kilograms: 3.75, selectable: true }
];

export const WEIGHT_INPUT_UNITS = WEIGHT_UNITS.filter((unit) => unit.selectable);

export const WEIGHT_GROUPS = {
  metric: WEIGHT_UNITS.filter((unit) => unit.system === 'metric'),
  imperial: WEIGHT_UNITS.filter((unit) => unit.system === 'imperial'),
  traditional: WEIGHT_UNITS.filter((unit) => unit.system === 'traditional')
} as const;

export const WEIGHT_MODES: WeightModeDefinition[] = [
  {
    key: 'standard',
    label: '標準',
    description: '日常用途向けです。kg・g・lb を優先して表示します。',
    unitOrder: {
      metric: ['kg', 'g', 't', 'mg'],
      imperial: ['lb', 'oz', 'st'],
      traditional: ['momme', 'ryo', 'kin', 'kan']
    }
  },
  {
    key: 'logistics',
    label: '物流',
    description: '物流・資材向けです。kg・t・lb・貫 を優先して表示します。',
    unitOrder: {
      metric: ['kg', 't', 'g', 'mg'],
      imperial: ['lb', 'st', 'oz'],
      traditional: ['kan', 'kin', 'ryo', 'momme']
    }
  },
  {
    key: 'cooking',
    label: '料理',
    description: '料理・計量向けです。g・kg・oz・匁 を優先して表示します。',
    unitOrder: {
      metric: ['g', 'kg', 'mg', 't'],
      imperial: ['oz', 'lb', 'st'],
      traditional: ['momme', 'ryo', 'kin', 'kan']
    }
  }
] as const;

export function getWeightUnit(unitKey: WeightUnit): WeightUnitDefinition {
  return WEIGHT_UNITS.find((unit) => unit.key === unitKey) ?? WEIGHT_UNITS[0];
}

export function getWeightMode(modeKey: WeightMode): WeightModeDefinition {
  return WEIGHT_MODES.find((mode) => mode.key === modeKey) ?? WEIGHT_MODES[0];
}

export function orderWeightUnits(units: WeightUnitDefinition[], order: WeightUnit[]): WeightUnitDefinition[] {
  const rank = new Map(order.map((unit, index) => [unit, index]));
  return [...units].sort((left, right) => (rank.get(left.key) ?? Number.MAX_SAFE_INTEGER) - (rank.get(right.key) ?? Number.MAX_SAFE_INTEGER));
}

export function parseWeightValue(value: string): number | null {
  return parseMeasurementValue(value);
}

export function sanitizeWeightInput(value: string): string {
  return sanitizeMeasurementInput(value);
}

export function formatWeightInput(value: string): string {
  return formatMeasurementInput(value);
}

export function convertWeight(value: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  const from = getWeightUnit(fromUnit);
  const to = getWeightUnit(toUnit);
  return (value * from.kilograms) / to.kilograms;
}

export function formatWeightParts(value: number | null): WeightDisplayParts {
  return formatMeasurementParts(value);
}

export function formatWeight(value: number | null): string {
  return formatWeightParts(value).text;
}
