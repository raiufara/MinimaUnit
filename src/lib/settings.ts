import type {
  AppSettings,
  AreaMode,
  CurrencyCooldownMinutes,
  CurrencyMode,
  CurrencyUnit,
  HistorySaveCount,
  ToolId,
  WeightMode
} from '../types';

export const APP_SETTINGS_STORAGE_KEY = 'unit-helper-settings-v1';
export const LAST_ACTIVE_TOOL_STORAGE_KEY = 'unit-helper-last-tool-v1';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  version: 1,
  themeMode: 'system',
  startupTool: 'era-age',
  preferLastTool: true,
  historyAutosave: true,
  historySaveCount: 10,
  defaultWeightMode: 'standard',
  defaultAreaMode: 'standard',
  defaultCurrencyMode: 'standard',
  defaultCurrencyUnit: 'jpy',
  currencyCooldownMinutes: 5
};

export const CURRENCY_COOLDOWN_OPTIONS: CurrencyCooldownMinutes[] = [3, 5, 10];
export const HISTORY_SAVE_COUNT_OPTIONS: HistorySaveCount[] = [5, 10, 20];

const TOOL_IDS: ToolId[] = ['era-age', 'length', 'weight', 'area', 'volume', 'temperature', 'speed', 'currency'];
const WEIGHT_MODES: WeightMode[] = ['standard', 'logistics', 'cooking'];
const AREA_MODES: AreaMode[] = ['standard', 'real-estate', 'farmland'];
const CURRENCY_MODES: CurrencyMode[] = ['standard', 'travel', 'business'];
const CURRENCY_UNITS: CurrencyUnit[] = ['jpy', 'usd', 'eur', 'cny', 'krw', 'twd', 'thb', 'sgd', 'hkd', 'gbp', 'aud'];

function normalizeSettings(candidate: unknown): AppSettings | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const parsed = candidate as Partial<AppSettings>;
  const themeMode =
    parsed.themeMode === 'light' || parsed.themeMode === 'dark' || parsed.themeMode === 'system'
      ? parsed.themeMode
      : DEFAULT_APP_SETTINGS.themeMode;
  const preferLastTool = typeof parsed.preferLastTool === 'boolean' ? parsed.preferLastTool : DEFAULT_APP_SETTINGS.preferLastTool;
  const historySaveCount =
    parsed.historySaveCount && HISTORY_SAVE_COUNT_OPTIONS.includes(parsed.historySaveCount)
      ? parsed.historySaveCount
      : DEFAULT_APP_SETTINGS.historySaveCount;

  if (
    parsed.version !== 1 ||
    !parsed.startupTool ||
    !TOOL_IDS.includes(parsed.startupTool) ||
    typeof parsed.historyAutosave !== 'boolean' ||
    !parsed.defaultWeightMode ||
    !WEIGHT_MODES.includes(parsed.defaultWeightMode) ||
    !parsed.defaultAreaMode ||
    !AREA_MODES.includes(parsed.defaultAreaMode) ||
    !parsed.defaultCurrencyMode ||
    !CURRENCY_MODES.includes(parsed.defaultCurrencyMode) ||
    !parsed.defaultCurrencyUnit ||
    !CURRENCY_UNITS.includes(parsed.defaultCurrencyUnit) ||
    !parsed.currencyCooldownMinutes ||
    !CURRENCY_COOLDOWN_OPTIONS.includes(parsed.currencyCooldownMinutes)
  ) {
    return null;
  }

  return {
    version: 1,
    themeMode,
    startupTool: parsed.startupTool,
    preferLastTool,
    historyAutosave: parsed.historyAutosave,
    historySaveCount,
    defaultWeightMode: parsed.defaultWeightMode,
    defaultAreaMode: parsed.defaultAreaMode,
    defaultCurrencyMode: parsed.defaultCurrencyMode,
    defaultCurrencyUnit: parsed.defaultCurrencyUnit,
    currencyCooldownMinutes: parsed.currencyCooldownMinutes
  };
}

export function loadAppSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_APP_SETTINGS;
    }

    return normalizeSettings(JSON.parse(raw)) ?? DEFAULT_APP_SETTINGS;
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors and keep runtime settings only.
  }
}

export function createInitialSettings(): AppSettings {
  return { ...DEFAULT_APP_SETTINGS };
}

export function getCurrencyCooldownMs(minutes: CurrencyCooldownMinutes): number {
  return minutes * 60 * 1000;
}

export function loadLastActiveTool(): ToolId | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_ACTIVE_TOOL_STORAGE_KEY);
    return raw && TOOL_IDS.includes(raw as ToolId) ? (raw as ToolId) : null;
  } catch {
    return null;
  }
}

export function saveLastActiveTool(toolId: ToolId): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LAST_ACTIVE_TOOL_STORAGE_KEY, toolId);
  } catch {
    // Ignore storage errors and keep runtime route only.
  }
}
