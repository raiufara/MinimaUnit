import type {
  AreaMode,
  AreaState,
  AreaUnit,
  CurrencyMode,
  CurrencyState,
  CurrencyUnit,
  DateInput,
  EraAgeState,
  EraType,
  InputMode,
  LengthState,
  LengthUnit,
  SpeedState,
  SpeedUnit,
  TemperatureState,
  TemperatureUnit,
  HistorySaveCount,
  ToolId,
  ToolStateMap,
  VolumeState,
  VolumeUnit,
  WeightMode,
  WeightState,
  WeightUnit
} from '../types';

export const HISTORY_STORAGE_KEY = 'unit-helper-history-v1';
export const DEFAULT_HISTORY_SAVE_COUNT: HistorySaveCount = 10;

export type ToolSnapshot<K extends ToolId = ToolId> = {
  toolId: K;
  state: ToolStateMap[K];
};

export interface HistoryEntry<K extends ToolId = ToolId> {
  id: string;
  toolId: K;
  toolLabel: string;
  title: string;
  summary: string;
  savedAt: string;
  snapshot: ToolSnapshot<K>;
}

const TOOL_LABELS: Record<ToolId, string> = {
  'era-age': '年齢・期間',
  length: '長さ',
  weight: '重さ',
  area: '面積',
  volume: '体積',
  temperature: '温度',
  speed: '速度',
  currency: '通貨'
};

const ERA_LABELS: Record<EraType, string> = {
  meiji: '明治',
  taisho: '大正',
  showa: '昭和',
  heisei: '平成',
  reiwa: '令和',
  gregorian: '西暦'
};

const LENGTH_LABELS: Record<LengthUnit, string> = {
  m: 'メートル',
  cm: 'センチメートル',
  mm: 'ミリメートル',
  km: 'キロメートル',
  in: 'インチ',
  ft: 'フィート',
  yd: 'ヤード',
  sun: '寸',
  shaku: '尺',
  ken: '間',
  ri: '里'
};

const WEIGHT_LABELS: Record<WeightUnit, string> = {
  t: 'トン',
  kg: 'キログラム',
  g: 'グラム',
  mg: 'ミリグラム',
  lb: 'ポンド',
  oz: 'オンス',
  st: 'ストーン',
  momme: '匁',
  ryo: '両',
  kin: '斤',
  kan: '貫'
};

const AREA_LABELS: Record<AreaUnit, string> = {
  sqm: '平方メートル',
  sqcm: '平方センチメートル',
  sqkm: '平方キロメートル',
  ha: 'ヘクタール',
  sqin: '平方インチ',
  sqft: '平方フィート',
  sqyd: '平方ヤード',
  acre: 'エーカー',
  tsubo: '坪',
  se: '畝',
  tan: '反',
  cho: '町'
};

const VOLUME_LABELS: Record<VolumeUnit, string> = {
  cum: '立方メートル',
  l: 'リットル',
  cucm: '立方センチメートル',
  cumm: '立方ミリメートル',
  usgal: 'USガロン',
  qt: 'クォート',
  pt: 'パイント',
  floz: '液量オンス',
  go: '合',
  sho: '升',
  to: '斗',
  koku: '石'
};

const TEMPERATURE_LABELS: Record<TemperatureUnit, string> = {
  c: '摂氏',
  f: '華氏',
  k: 'ケルビン',
  r: 'ランキン'
};

const SPEED_LABELS: Record<SpeedUnit, string> = {
  kmh: 'km/h',
  ms: 'm/s',
  mph: 'mph',
  knot: 'ノット',
  fts: 'ft/s',
  mach: 'マッハ',
  lightspeed: '光速'
};

const CURRENCY_LABELS: Record<CurrencyUnit, string> = {
  jpy: '日本円',
  usd: '米ドル',
  eur: 'ユーロ',
  cny: '人民元',
  krw: '韓国ウォン',
  twd: '台湾ドル',
  thb: 'タイバーツ',
  sgd: 'シンガポールドル',
  hkd: '香港ドル',
  gbp: '英ポンド',
  aud: '豪ドル'
};

const WEIGHT_MODE_LABELS: Record<WeightMode, string> = {
  standard: '標準モード',
  logistics: '物流モード',
  cooking: '料理モード'
};

const AREA_MODE_LABELS: Record<AreaMode, string> = {
  standard: '標準モード',
  'real-estate': '不動産モード',
  farmland: '農地モード'
};

const CURRENCY_MODE_LABELS: Record<CurrencyMode, string> = {
  standard: '標準モード',
  travel: '旅行モード',
  business: '業務モード'
};

function formatNumber(value: string): string {
  const sanitized = value.replace(/,/g, '').trim();
  if (sanitized === '' || sanitized === '-' || sanitized === '.' || sanitized === '-.') {
    return '0';
  }

  const numeric = Number(sanitized);
  if (!Number.isFinite(numeric)) {
    return sanitized;
  }

  return new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 6
  }).format(numeric);
}

function formatDateInput(input: DateInput, mode: InputMode): string {
  if (mode === 'age') {
    return `${formatNumber(String(input.year))}歳`;
  }

  if (mode === 'gregorian' || input.era === 'gregorian') {
    if (input.granularity === 'year') {
      return `${input.year}年`;
    }
    return `${input.year}年${input.month ?? 1}月${input.day ?? 1}日`;
  }

  const eraLabel = ERA_LABELS[input.era];
  if (input.granularity === 'year') {
    return `${eraLabel}${input.year}年`;
  }

  return `${eraLabel}${input.year}年${input.month ?? 1}月${input.day ?? 1}日`;
}

function buildEraAgeText(state: EraAgeState): Pick<HistoryEntry<'era-age'>, 'title' | 'summary'> {
  const base = formatDateInput(state.baseDate, state.baseInputMode);
  const target = formatDateInput(state.targetDate, state.targetInputMode);
  const ageSummary = state.result.age === null ? '年齢は未確定です。' : `満年齢 ${state.result.age}歳を確認しました。`;

  return {
    title: `${base} → ${target}`,
    summary: ageSummary
  };
}

function buildMeasurementText(
  value: string,
  unitLabel: string,
  summary: string
): Pick<HistoryEntry, 'title' | 'summary'> {
  return {
    title: `${formatNumber(value)} ${unitLabel}`,
    summary
  };
}

function buildHistoryText<K extends ToolId>(toolId: K, state: ToolStateMap[K]): Pick<HistoryEntry<K>, 'title' | 'summary'> {
  switch (toolId) {
    case 'era-age':
      return buildEraAgeText(state as EraAgeState) as Pick<HistoryEntry<K>, 'title' | 'summary'>;
    case 'length':
      return buildMeasurementText(
        (state as LengthState).inputValue,
        LENGTH_LABELS[(state as LengthState).inputUnit],
        '基準単位から他の長さ単位へ換算します。'
      ) as Pick<HistoryEntry<K>, 'title' | 'summary'>;
    case 'weight':
      return buildMeasurementText(
        (state as WeightState).inputValue,
        WEIGHT_LABELS[(state as WeightState).inputUnit],
        `${WEIGHT_MODE_LABELS[(state as WeightState).mode]}で確認しました。`
      ) as Pick<HistoryEntry<K>, 'title' | 'summary'>;
    case 'area':
      return buildMeasurementText(
        (state as AreaState).inputValue,
        AREA_LABELS[(state as AreaState).inputUnit],
        `${AREA_MODE_LABELS[(state as AreaState).mode]}で確認しました。`
      ) as Pick<HistoryEntry<K>, 'title' | 'summary'>;
    case 'volume':
      return buildMeasurementText(
        (state as VolumeState).inputValue,
        VOLUME_LABELS[(state as VolumeState).inputUnit],
        '基準単位から他の体積単位へ換算します。'
      ) as Pick<HistoryEntry<K>, 'title' | 'summary'>;
    case 'temperature':
      return buildMeasurementText(
        (state as TemperatureState).inputValue,
        TEMPERATURE_LABELS[(state as TemperatureState).inputUnit],
        '基準単位から他の温度単位へ換算します。'
      ) as Pick<HistoryEntry<K>, 'title' | 'summary'>;
    case 'speed':
      return buildMeasurementText(
        (state as SpeedState).inputValue,
        SPEED_LABELS[(state as SpeedState).inputUnit],
        '基準単位から他の速度単位へ換算します。'
      ) as Pick<HistoryEntry<K>, 'title' | 'summary'>;
    case 'currency':
      return buildMeasurementText(
        (state as CurrencyState).inputValue,
        CURRENCY_LABELS[(state as CurrencyState).inputUnit],
        `${CURRENCY_MODE_LABELS[(state as CurrencyState).mode]}で確認しました。`
      ) as Pick<HistoryEntry<K>, 'title' | 'summary'>;
    default:
      return {
        title: TOOL_LABELS[toolId],
        summary: '履歴を保存しました。'
      } as Pick<HistoryEntry<K>, 'title' | 'summary'>;
  }
}

export function buildHistoryEntry<K extends ToolId>(toolId: K, state: ToolStateMap[K]): HistoryEntry<K> {
  const texts = buildHistoryText(toolId, state);

  return {
    id: `${toolId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    toolId,
    toolLabel: TOOL_LABELS[toolId],
    title: texts.title,
    summary: texts.summary,
    savedAt: new Date().toISOString(),
    snapshot: {
      toolId,
      state: JSON.parse(JSON.stringify(state)) as ToolStateMap[K]
    }
  };
}

export function loadHistoryEntries(): HistoryEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as HistoryEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is HistoryEntry =>
        Boolean(
          entry &&
            typeof entry.id === 'string' &&
            typeof entry.toolId === 'string' &&
            typeof entry.toolLabel === 'string' &&
            typeof entry.title === 'string' &&
            typeof entry.summary === 'string' &&
            typeof entry.savedAt === 'string' &&
            entry.snapshot &&
            typeof entry.snapshot === 'object'
        )
    );
  } catch {
    return [];
  }
}

export function saveHistoryEntries(entries: HistoryEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
}

export function upsertHistoryEntry(
  entries: HistoryEntry[],
  nextEntry: HistoryEntry,
  maxPerTool: HistorySaveCount = DEFAULT_HISTORY_SAVE_COUNT
): HistoryEntry[] {
  const latestSameTool = entries.find((entry) => entry.toolId === nextEntry.toolId);
  if (latestSameTool) {
    const latestState = JSON.stringify(latestSameTool.snapshot.state);
    const nextState = JSON.stringify(nextEntry.snapshot.state);
    if (latestState === nextState) {
      return entries;
    }
  }

  const counts = new Map<ToolId, number>();
  const nextEntries = [nextEntry, ...entries].filter((entry) => {
    const nextCount = (counts.get(entry.toolId) ?? 0) + 1;
    counts.set(entry.toolId, nextCount);
    return nextCount <= maxPerTool;
  });

  return nextEntries.slice(0, maxPerTool * 8);
}

export function removeHistoryEntry(entries: HistoryEntry[], entryId: string): HistoryEntry[] {
  return entries.filter((entry) => entry.id !== entryId);
}

export function clearHistoryEntries(entries: HistoryEntry[], toolId?: ToolId): HistoryEntry[] {
  if (!toolId) {
    return [];
  }

  return entries.filter((entry) => entry.toolId !== toolId);
}
