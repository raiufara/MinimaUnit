import {
  formatMeasurementInput,
  formatMeasurementParts,
  parseMeasurementValue,
  sanitizeMeasurementInput,
  type MeasurementDisplayParts
} from './measurement';
import type { VolumeUnit } from '../types';

export interface VolumeUnitDefinition {
  key: VolumeUnit;
  label: string;
  shortLabel: string;
  displayLabel: string;
  system: 'metric' | 'imperial' | 'traditional';
  cubicMeters: number;
  selectable: boolean;
}

export type VolumeDisplayParts = MeasurementDisplayParts;

export const VOLUME_UNITS: VolumeUnitDefinition[] = [
  { key: 'cum', label: '立方メートル', shortLabel: 'm³', displayLabel: '立方メートル (m³)', system: 'metric', cubicMeters: 1, selectable: true },
  { key: 'l', label: 'リットル', shortLabel: 'L', displayLabel: 'リットル (L)', system: 'metric', cubicMeters: 0.001, selectable: true },
  { key: 'cucm', label: '立方センチ', shortLabel: 'cm³', displayLabel: '立方センチメートル (cm³)', system: 'metric', cubicMeters: 0.000001, selectable: true },
  { key: 'cumm', label: '立方ミリ', shortLabel: 'mm³', displayLabel: '立方ミリメートル (mm³)', system: 'metric', cubicMeters: 0.000000001, selectable: true },
  { key: 'usgal', label: 'USガロン', shortLabel: 'gal', displayLabel: 'USガロン (gal)', system: 'imperial', cubicMeters: 0.003785411784, selectable: true },
  { key: 'qt', label: 'クォート', shortLabel: 'qt', displayLabel: 'クォート (qt)', system: 'imperial', cubicMeters: 0.000946352946, selectable: true },
  { key: 'pt', label: 'パイント', shortLabel: 'pt', displayLabel: 'パイント (pt)', system: 'imperial', cubicMeters: 0.000473176473, selectable: true },
  { key: 'floz', label: '液量オンス', shortLabel: 'fl oz', displayLabel: '液量オンス (fl oz)', system: 'imperial', cubicMeters: 0.0000295735295625, selectable: true },
  { key: 'go', label: '合', shortLabel: '合', displayLabel: '合 (Go)', system: 'traditional', cubicMeters: 0.00018039, selectable: true },
  { key: 'sho', label: '升', shortLabel: '升', displayLabel: '升 (Sho)', system: 'traditional', cubicMeters: 0.0018039, selectable: true },
  { key: 'to', label: '斗', shortLabel: '斗', displayLabel: '斗 (To)', system: 'traditional', cubicMeters: 0.018039, selectable: true },
  { key: 'koku', label: '石', shortLabel: '石', displayLabel: '石 (Koku)', system: 'traditional', cubicMeters: 0.18039, selectable: true }
];

export const VOLUME_INPUT_UNITS = VOLUME_UNITS.filter((unit) => unit.selectable);

export const VOLUME_GROUPS = {
  metric: VOLUME_UNITS.filter((unit) => unit.system === 'metric'),
  imperial: VOLUME_UNITS.filter((unit) => unit.system === 'imperial'),
  traditional: VOLUME_UNITS.filter((unit) => unit.system === 'traditional')
} as const;

export function getVolumeUnit(unitKey: VolumeUnit): VolumeUnitDefinition {
  return VOLUME_UNITS.find((unit) => unit.key === unitKey) ?? VOLUME_UNITS[0];
}

export function parseVolumeValue(value: string): number | null {
  return parseMeasurementValue(value);
}

export function sanitizeVolumeInput(value: string): string {
  return sanitizeMeasurementInput(value);
}

export function formatVolumeInput(value: string): string {
  return formatMeasurementInput(value);
}

export function convertVolume(value: number, fromUnit: VolumeUnit, toUnit: VolumeUnit): number {
  const from = getVolumeUnit(fromUnit);
  const to = getVolumeUnit(toUnit);
  return (value * from.cubicMeters) / to.cubicMeters;
}

export function formatVolumeParts(value: number | null): VolumeDisplayParts {
  return formatMeasurementParts(value);
}

export function formatVolume(value: number | null): string {
  return formatVolumeParts(value).text;
}
