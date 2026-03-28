import type { ConversionResult, DateInput, EraAgeComputationResult, EraType, InputMode, NormalizedDateResult } from '../types';

interface EraDefinition {
  type: Exclude<EraType, 'gregorian'>;
  label: string;
  ruby: string;
  start: Date;
  offset: number;
}

const ERA_DEFINITIONS: EraDefinition[] = [
  { type: 'meiji', label: '明治', ruby: 'めいじ', start: new Date(1868, 0, 23), offset: 1867 },
  { type: 'taisho', label: '大正', ruby: 'たいしょう', start: new Date(1912, 6, 30), offset: 1911 },
  { type: 'showa', label: '昭和', ruby: 'しょうわ', start: new Date(1926, 11, 25), offset: 1925 },
  { type: 'heisei', label: '平成', ruby: 'へいせい', start: new Date(1989, 0, 8), offset: 1988 },
  { type: 'reiwa', label: '令和', ruby: 'れいわ', start: new Date(2019, 4, 1), offset: 2018 }
];

const SUPPORTED_START = new Date(1868, 0, 23);
const HEAVENLY_STEMS = [
  { kanji: '甲', ruby: 'きのえ' },
  { kanji: '乙', ruby: 'きのと' },
  { kanji: '丙', ruby: 'ひのえ' },
  { kanji: '丁', ruby: 'ひのと' },
  { kanji: '戊', ruby: 'つちのえ' },
  { kanji: '己', ruby: 'つちのと' },
  { kanji: '庚', ruby: 'かのえ' },
  { kanji: '辛', ruby: 'かのと' },
  { kanji: '壬', ruby: 'みずのえ' },
  { kanji: '癸', ruby: 'みずのと' }
] as const;
const EARTHLY_BRANCHES = [
  { kanji: '子', ruby: 'ね' },
  { kanji: '丑', ruby: 'うし' },
  { kanji: '寅', ruby: 'とら' },
  { kanji: '卯', ruby: 'う' },
  { kanji: '辰', ruby: 'たつ' },
  { kanji: '巳', ruby: 'み' },
  { kanji: '午', ruby: 'うま' },
  { kanji: '未', ruby: 'ひつじ' },
  { kanji: '申', ruby: 'さる' },
  { kanji: '酉', ruby: 'とり' },
  { kanji: '戌', ruby: 'いぬ' },
  { kanji: '亥', ruby: 'い' }
] as const;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
}

function modulo(value: number, base: number): number {
  return ((value % base) + base) % base;
}

function isValidGregorianDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  const maxDay = getDaysInMonth(year, month);
  return day >= 1 && day <= maxDay;
}

function toUtcDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

function calculateExactDuration(start: Date, end: Date) {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    const previousMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += previousMonthLastDay;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return {
    years,
    months,
    days,
    totalMonths: years * 12 + months,
    totalDays: toUtcDayNumber(end) - toUtcDayNumber(start)
  };
}

function shiftFullYears(date: Date, yearDelta: number): Date {
  return new Date(date.getFullYear() + yearDelta, date.getMonth(), date.getDate());
}

function formatWarekiLabel(era: EraDefinition, warekiYear: number): string {
  return `${era.label}${warekiYear}年`;
}

function formatGregorianDateLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function getEraPeriodLabels(): string[] {
  return ERA_DEFINITIONS.map((era, index) => {
    const nextEra = ERA_DEFINITIONS[index + 1];
    const endDate = nextEra
      ? new Date(nextEra.start.getFullYear(), nextEra.start.getMonth(), nextEra.start.getDate() - 1)
      : null;

    return `${era.label}：${formatGregorianDateLabel(era.start)} 〜 ${endDate ? formatGregorianDateLabel(endDate) : ''}`;
  });
}

function findCanonicalEra(date: Date): EraDefinition | null {
  for (let index = ERA_DEFINITIONS.length - 1; index >= 0; index -= 1) {
    const era = ERA_DEFINITIONS[index];
    if (date >= era.start) {
      return era;
    }
  }

  return null;
}

export function toDateParts(date: Date): DateInput {
  const canonicalEra = findCanonicalEra(date);
  if (!canonicalEra) {
    return {
      era: 'gregorian',
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      granularity: 'date'
    };
  }

  return {
    era: canonicalEra.type,
    year: date.getFullYear() - canonicalEra.offset,
    month: date.getMonth() + 1,
    day: date.getDate(),
    granularity: 'date'
  };
}

export function formatEraYearLabel(input: DateInput, gregorianYear: number | null): string | null {
  if (!gregorianYear) {
    return null;
  }

  if (input.era === 'gregorian') {
    const era = findCanonicalEra(new Date(gregorianYear, 11, 31));
    if (!era) {
      return `${gregorianYear}年`;
    }
    const year = gregorianYear - era.offset;
    return `${era.label}${year}年`;
  }

  const enteredEra = ERA_DEFINITIONS.find((era) => era.type === input.era);
  return enteredEra ? `${enteredEra.label}${input.year}年` : null;
}

export function getZodiac(gregorianYear: number | null) {
  if (!gregorianYear) {
    return {
      stem: null,
      branch: null,
      eto: null,
      ruby: null
    };
  }

  const stem = HEAVENLY_STEMS[modulo(gregorianYear - 4, HEAVENLY_STEMS.length)];
  const branch = EARTHLY_BRANCHES[modulo(gregorianYear - 4, EARTHLY_BRANCHES.length)];

  return {
    stem: stem.kanji,
    branch: branch.kanji,
    eto: `${stem.kanji}${branch.kanji}`,
    ruby: `${stem.ruby}・${branch.ruby}`
  };
}

export function normalizeToGregorian(input: DateInput): ConversionResult {
  const normalized = normalizeDateInput(input);
  return {
    gregorianYear: normalized.gregorianYear,
    warnings: normalized.warnings,
    errors: normalized.errors
  };
}

export function normalizeDateInput(input: DateInput): NormalizedDateResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const granularity = input.granularity ?? 'date';

  if (!Number.isInteger(input.year) || input.year < 1) {
    errors.push('年は1以上の整数で入力してください。');
  }

  if (granularity === 'date') {
    if (!Number.isInteger(input.month) || (input.month ?? 0) < 1 || (input.month ?? 0) > 12) {
      errors.push('月は1〜12で入力してください。');
    }

    if (!Number.isInteger(input.day) || (input.day ?? 0) < 1 || (input.day ?? 0) > 31) {
      errors.push('日は1〜31で入力してください。');
    }
  }

  if (errors.length > 0) {
    return { gregorianYear: null, gregorianDate: null, warnings, errors };
  }

  const gregorianYear =
    input.era === 'gregorian'
      ? input.year
      : (ERA_DEFINITIONS.find((era) => era.type === input.era)?.offset ?? 0) + input.year;

  const month = granularity === 'date' ? input.month ?? 1 : 1;
  const day = granularity === 'date' ? input.day ?? 1 : 1;

  if (!isValidGregorianDate(gregorianYear, month, day)) {
    errors.push('存在しない日付です。');
    return { gregorianYear: null, gregorianDate: null, warnings, errors };
  }

  const candidateDate = new Date(gregorianYear, month - 1, day);

  if (candidateDate < SUPPORTED_START) {
    errors.push('1868年1月23日より前は未対応です。');
    return { gregorianYear: null, gregorianDate: null, warnings, errors };
  }

  if (input.era !== 'gregorian') {
    const enteredEra = ERA_DEFINITIONS.find((era) => era.type === input.era);
    const canonicalEra = findCanonicalEra(candidateDate);

    if (!enteredEra || !canonicalEra) {
      errors.push('元号を解釈できませんでした。');
      return { gregorianYear: null, gregorianDate: null, warnings, errors };
    }

    if (input.era === 'heisei' && gregorianYear >= 2020) {
      const canonicalYear = candidateDate.getFullYear() - canonicalEra.offset;
      warnings.push(`※${formatWarekiLabel(canonicalEra, canonicalYear)}に相当します。`);
    } else if (input.era === 'heisei' && gregorianYear === 2019 && granularity === 'year') {
      warnings.push('※2019年は平成31年と令和元年の両方にまたがります。');
    } else if (granularity === 'date' && candidateDate < enteredEra.start) {
      errors.push(`入力日付は${enteredEra.label}の開始前です。`);
    } else if (granularity === 'date' && canonicalEra.type !== input.era) {
      errors.push(`入力日付は${canonicalEra.label}の期間に属します。`);
    }
  }

  if (errors.length > 0) {
    return { gregorianYear: null, gregorianDate: null, warnings, errors };
  }

  return {
    gregorianYear,
    gregorianDate: candidateDate,
    warnings,
    errors
  };
}

export function calculateAge(baseDate: DateInput, targetDate: DateInput): number | null {
  if ((baseDate.granularity ?? 'date') !== 'date' || (targetDate.granularity ?? 'date') !== 'date') {
    return null;
  }

  const base = normalizeDateInput(baseDate);
  const target = normalizeDateInput(targetDate);

  if (!base.gregorianDate || !target.gregorianDate || base.errors.length > 0 || target.errors.length > 0) {
    return null;
  }

  if (target.gregorianDate < base.gregorianDate) {
    return null;
  }

  let age = target.gregorianDate.getFullYear() - base.gregorianDate.getFullYear();
  const monthDiff = target.gregorianDate.getMonth() - base.gregorianDate.getMonth();
  const dayDiff = target.gregorianDate.getDate() - base.gregorianDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

export function resolveModeInput(input: DateInput, inputMode: InputMode): DateInput {
  if (inputMode === 'gregorian') {
    return {
      ...input,
      era: 'gregorian'
    };
  }

  return input;
}

export function deriveAgeModeBaseDate(targetDate: DateInput, ageYears: number): DateInput | null {
  const normalizedTarget = normalizeDateInput(targetDate);
  if (normalizedTarget.errors.length > 0 || (!normalizedTarget.gregorianDate && normalizedTarget.gregorianYear === null)) {
    return null;
  }

  if ((targetDate.granularity ?? 'date') === 'date' && normalizedTarget.gregorianDate) {
    const derivedDate = shiftFullYears(normalizedTarget.gregorianDate, -ageYears);
    return {
      era: 'gregorian',
      year: derivedDate.getFullYear(),
      month: derivedDate.getMonth() + 1,
      day: derivedDate.getDate(),
      granularity: 'date'
    };
  }

  return {
    era: 'gregorian',
    year: (normalizedTarget.gregorianYear ?? 0) - ageYears,
    granularity: 'year'
  };
}

export function deriveAgeModeTargetDate(baseDate: DateInput, ageYears: number): DateInput | null {
  const normalizedBase = normalizeDateInput(baseDate);
  if (normalizedBase.errors.length > 0 || (!normalizedBase.gregorianDate && normalizedBase.gregorianYear === null)) {
    return null;
  }

  if ((baseDate.granularity ?? 'date') === 'date' && normalizedBase.gregorianDate) {
    const derivedDate = shiftFullYears(normalizedBase.gregorianDate, ageYears);
    return {
      era: 'gregorian',
      year: derivedDate.getFullYear(),
      month: derivedDate.getMonth() + 1,
      day: derivedDate.getDate(),
      granularity: 'date'
    };
  }

  return {
    era: 'gregorian',
    year: (normalizedBase.gregorianYear ?? 0) + ageYears,
    granularity: 'year'
  };
}

export function computeEraAgeResult(baseDate: DateInput, targetDate: DateInput): EraAgeComputationResult {
  const base = normalizeDateInput(baseDate);
  const target = normalizeDateInput(targetDate);
  const warnings = [...base.warnings, ...target.warnings];
  const errors = [...base.errors, ...target.errors];

  let age: number | null = null;
  let duration = {
    years: null,
    months: null,
    days: null,
    totalMonths: null,
    totalDays: null
  } as EraAgeComputationResult['duration'];

  if (errors.length === 0 && base.gregorianDate && target.gregorianDate) {
    if (target.gregorianDate < base.gregorianDate) {
      errors.push('対象日は基準日以降を指定してください。');
    } else {
      age = calculateAge(baseDate, targetDate);
      if (age === null && ((baseDate.granularity ?? 'date') !== 'date' || (targetDate.granularity ?? 'date') !== 'date')) {
        age = (target.gregorianYear ?? 0) - (base.gregorianYear ?? 0);
        duration = {
          years: age,
          months: null,
          days: null,
          totalMonths: age * 12,
          totalDays: null
        };
        warnings.push('年のみ入力のため、年数のみ表示しています。');
      } else {
        duration = calculateExactDuration(base.gregorianDate, target.gregorianDate);
      }
    }
  } else if (errors.length === 0 && base.gregorianYear !== null && target.gregorianYear !== null) {
    if (target.gregorianYear < base.gregorianYear) {
      errors.push('対象年は基準年以降を指定してください。');
    } else {
      age = target.gregorianYear - base.gregorianYear;
      duration = {
        years: age,
        months: null,
        days: null,
        totalMonths: age * 12,
        totalDays: null
      };
      warnings.push('年のみ入力のため、年数のみ表示しています。');
    }
  }

  return {
    age,
    baseGregorianYear: base.gregorianYear,
    targetGregorianYear: target.gregorianYear,
    baseEraLabel: formatEraYearLabel(baseDate, base.gregorianYear),
    targetEraLabel: formatEraYearLabel(targetDate, target.gregorianYear),
    imperialYear: base.gregorianYear ? base.gregorianYear + 660 : null,
    duration,
    zodiac: getZodiac(base.gregorianYear),
    warnings,
    errors
  };
}
