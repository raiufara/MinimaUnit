export interface MeasurementDisplayParts {
  text: string;
  whole: string;
  fraction: string;
  rounded: boolean;
}

export function parseMeasurementValue(value: string): number | null {
  const normalized = value.replace(/,/g, '').trim();

  if (normalized === '' || normalized === '-' || normalized === '.' || normalized === '-.') {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function sanitizeMeasurementInput(value: string): string {
  const stripped = value.replace(/,/g, '').replace(/[^\d.-]/g, '');

  if (stripped === '') {
    return '';
  }

  const hasNegativeSign = stripped.startsWith('-');
  const unsigned = (hasNegativeSign ? stripped.slice(1) : stripped).replace(/-/g, '');
  const hasDecimal = unsigned.includes('.');
  const [integerPart = '', ...fractionParts] = unsigned.split('.');
  const fractionPart = fractionParts.join('');

  if (integerPart === '' && fractionPart === '') {
    if (hasNegativeSign && !hasDecimal) {
      return '-';
    }

    return hasNegativeSign ? '-0.' : '0.';
  }

  const normalizedInteger = integerPart === '' ? '0' : integerPart;
  return `${hasNegativeSign ? '-' : ''}${normalizedInteger}${hasDecimal ? `.${fractionPart}` : ''}`;
}

function addThousandsSeparators(value: string): string {
  const normalized = value.replace(/^0+(?=\d)/, '') || '0';
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatMeasurementInput(value: string): string {
  const normalized = value.replace(/,/g, '');

  if (normalized === '') {
    return '';
  }

  if (normalized === '-') {
    return '-';
  }

  const isNegative = normalized.startsWith('-');
  const unsigned = isNegative ? normalized.slice(1) : normalized;
  const hasDecimal = unsigned.includes('.');
  const [integerPart = '', fractionPart = ''] = unsigned.split('.');
  const formattedInteger = addThousandsSeparators(integerPart === '' ? '0' : integerPart);

  return `${isNegative ? '-' : ''}${formattedInteger}${hasDecimal ? `.${fractionPart}` : ''}`;
}

function getMaximumFractionDigits(value: number): number {
  const abs = Math.abs(value);
  return abs >= 1000 ? 0 : abs >= 100 ? 2 : abs >= 1 ? 4 : 6;
}

export function formatMeasurementParts(value: number | null): MeasurementDisplayParts {
  if (value === null) {
    return {
      text: '-',
      whole: '-',
      fraction: '',
      rounded: false
    };
  }

  const maximumFractionDigits = getMaximumFractionDigits(value);
  const roundedValue = Number(value.toFixed(maximumFractionDigits));
  const text = roundedValue.toLocaleString('ja-JP', {
    minimumFractionDigits: 0,
    maximumFractionDigits
  });
  const [whole, fraction = ''] = text.split('.');
  const tolerance = Math.max(1e-12, Math.abs(value) * 1e-10);

  return {
    text,
    whole,
    fraction,
    rounded: Math.abs(value - roundedValue) > tolerance
  };
}
