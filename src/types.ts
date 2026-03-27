export type EraType = 'meiji' | 'taisho' | 'showa' | 'heisei' | 'reiwa' | 'gregorian';
export type InputMode = 'era' | 'gregorian' | 'age';
export type ToolId = 'era-age' | 'length' | 'weight' | 'area' | 'volume' | 'temperature' | 'speed' | 'currency';
export type LengthUnit = 'm' | 'cm' | 'mm' | 'km' | 'in' | 'ft' | 'yd' | 'sun' | 'shaku' | 'ken' | 'ri';
export type WeightUnit = 't' | 'kg' | 'g' | 'mg' | 'lb' | 'oz' | 'st' | 'momme' | 'ryo' | 'kin' | 'kan';
export type WeightMode = 'standard' | 'logistics' | 'cooking';
export type AreaUnit = 'sqm' | 'sqcm' | 'sqkm' | 'ha' | 'sqin' | 'sqft' | 'sqyd' | 'acre' | 'tsubo' | 'se' | 'tan' | 'cho';
export type AreaMode = 'standard' | 'real-estate' | 'farmland';
export type VolumeUnit = 'cum' | 'l' | 'cucm' | 'cumm' | 'usgal' | 'qt' | 'pt' | 'floz' | 'go' | 'sho' | 'to' | 'koku';
export type TemperatureUnit = 'c' | 'f' | 'k' | 'r';
export type SpeedUnit = 'kmh' | 'ms' | 'mph' | 'knot' | 'fts' | 'mach' | 'lightspeed';
export type CurrencyUnit = 'jpy' | 'usd' | 'eur' | 'cny' | 'krw' | 'twd' | 'thb' | 'sgd' | 'hkd' | 'gbp' | 'aud';
export type CurrencyMode = 'standard' | 'travel' | 'business';
export type CurrencyCooldownMinutes = 3 | 5 | 10;
export type HistorySaveCount = 5 | 10 | 20;
export type ThemeMode = 'light' | 'dark' | 'system';
export type InfoSectionId = 'privacy' | 'terms' | 'contact' | 'currency';

export interface DateInput {
  era: EraType;
  year: number;
  month?: number;
  day?: number;
  granularity?: 'year' | 'date';
}

export interface ConversionResult {
  gregorianYear: number | null;
  warnings: string[];
  errors: string[];
}

export interface NormalizedDateResult extends ConversionResult {
  gregorianDate: Date | null;
}

export interface EraAgeComputationResult {
  age: number | null;
  baseGregorianYear: number | null;
  targetGregorianYear: number | null;
  baseEraLabel: string | null;
  targetEraLabel: string | null;
  imperialYear: number | null;
  duration: {
    years: number | null;
    months: number | null;
    days: number | null;
    totalMonths: number | null;
    totalDays: number | null;
  };
  zodiac: {
    stem: string | null;
    branch: string | null;
    eto: string | null;
    ruby: string | null;
  };
  warnings: string[];
  errors: string[];
}

export interface EraAgeState {
  baseDate: DateInput;
  targetDate: DateInput;
  baseInputMode: InputMode;
  targetInputMode: InputMode;
  result: EraAgeComputationResult;
}

export interface LengthState {
  inputValue: string;
  inputUnit: LengthUnit;
}

export interface WeightState {
  inputValue: string;
  inputUnit: WeightUnit;
  mode: WeightMode;
}

export interface AreaState {
  inputValue: string;
  inputUnit: AreaUnit;
  mode: AreaMode;
}

export interface VolumeState {
  inputValue: string;
  inputUnit: VolumeUnit;
}

export interface TemperatureState {
  inputValue: string;
  inputUnit: TemperatureUnit;
}

export interface SpeedState {
  inputValue: string;
  inputUnit: SpeedUnit;
}

export interface CurrencyState {
  inputValue: string;
  inputUnit: CurrencyUnit;
  mode: CurrencyMode;
}

export interface AppSettings {
  version: 1;
  themeMode: ThemeMode;
  startupTool: ToolId;
  preferLastTool: boolean;
  historyAutosave: boolean;
  historySaveCount: HistorySaveCount;
  defaultWeightMode: WeightMode;
  defaultAreaMode: AreaMode;
  defaultCurrencyMode: CurrencyMode;
  defaultCurrencyUnit: CurrencyUnit;
  currencyCooldownMinutes: CurrencyCooldownMinutes;
}

export interface ToolStateMap {
  'era-age': EraAgeState;
  length: LengthState;
  weight: WeightState;
  area: AreaState;
  volume: VolumeState;
  temperature: TemperatureState;
  speed: SpeedState;
  currency: CurrencyState;
}
