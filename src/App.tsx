import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AreaConverter } from './components/AreaConverter';
import { CurrencyConverter } from './components/CurrencyConverter';
import { EraAgeConverter } from './components/EraAgeConverter';
import { HistoryDrawer } from './components/HistoryDrawer';
import { InfoDrawer } from './components/InfoDrawer';
import { Layout } from './components/Layout';
import { LengthConverter } from './components/LengthConverter';
import { SettingsDrawer } from './components/SettingsDrawer';
import { SpeedConverter } from './components/SpeedConverter';
import { TemperatureConverter } from './components/TemperatureConverter';
import { VolumeConverter } from './components/VolumeConverter';
import { WeightConverter } from './components/WeightConverter';
import {
  buildHistoryEntry,
  clearHistoryEntries,
  loadHistoryEntries,
  removeHistoryEntry,
  saveHistoryEntries,
  upsertHistoryEntry,
  type HistoryEntry
} from './lib/history';
import { computeEraAgeResult, toDateParts } from './lib/era';
import {
  createInitialSettings,
  getCurrencyCooldownMs,
  loadAppSettings,
  loadLastActiveTool,
  saveLastActiveTool,
  saveAppSettings
} from './lib/settings';
import type {
  AppSettings,
  AreaState,
  CurrencyState,
  EraAgeState,
  InfoSectionId,
  LengthState,
  SpeedState,
  TemperatureState,
  ToolId,
  ToolStateMap,
  VolumeState,
  WeightState
} from './types';

interface ToolItem {
  id: ToolId;
  label: string;
  path: string;
  enabled: boolean;
  description: string;
}

const TOOL_ITEMS: readonly ToolItem[] = [
  {
    id: 'era-age',
    label: '年齢・期間',
    path: '/era-age',
    enabled: true,
    description: '和暦・西暦・年齢・経過期間をまとめて確認できます。日付の比較や公的書類の確認にも使いやすい構成です。'
  },
  {
    id: 'length',
    label: '長さ',
    path: '/length',
    enabled: true,
    description: 'メートル法・インペリアル法・尺貫法の長さを、実務寄りの並びで素早く比較できます。'
  },
  {
    id: 'weight',
    label: '重さ',
    path: '/weight',
    enabled: true,
    description: 'メートル法・インペリアル法・尺貫法の重さを、標準・物流・料理モードで比較できます。'
  },
  {
    id: 'area',
    label: '面積',
    path: '/area',
    enabled: true,
    description: 'メートル法・インペリアル法・和式土地単位の面積を、標準・不動産・農地モードで見比べられます。'
  },
  {
    id: 'volume',
    label: '体積',
    path: '/volume',
    enabled: true,
    description: 'メートル法・液量系・尺貫法の体積を、まとまりのよいカード表示で比較できます。'
  },
  {
    id: 'temperature',
    label: '温度',
    path: '/temperature',
    enabled: true,
    description: '日常温度と科学・工学向けの温度尺度を、主要単位を中心に比較できます。'
  },
  {
    id: 'speed',
    label: '速度',
    path: '/speed',
    enabled: true,
    description: '日常・交通・航海・科学用途の速度を比較できます。音速と光速にも対応しています。'
  },
  {
    id: 'currency',
    label: '通貨',
    path: '/currency',
    enabled: true,
    description: '主要通貨とアジア通貨を、参考レートの基準日つきで軽量に比較できます。旅行・業務向けモードにも対応しています。'
  }
] as const;

const HISTORY_SAVE_DELAY_MS = 900;

function createInitialState(): EraAgeState {
  const today = new Date();

  const baseDate = {
    era: 'heisei' as const,
    year: 12,
    month: 4,
    day: 1,
    granularity: 'date' as const
  };
  const targetDate = toDateParts(today);

  return {
    baseDate,
    targetDate,
    baseInputMode: 'era',
    targetInputMode: 'era',
    result: computeEraAgeResult(baseDate, targetDate)
  };
}

function createInitialLengthState(): LengthState {
  return {
    inputValue: '1',
    inputUnit: 'm'
  };
}

function createInitialWeightState(settings: AppSettings): WeightState {
  return {
    inputValue: '1',
    inputUnit: 'kg',
    mode: settings.defaultWeightMode
  };
}

function createInitialAreaState(settings: AppSettings): AreaState {
  return {
    inputValue: '1',
    inputUnit: 'sqm',
    mode: settings.defaultAreaMode
  };
}

function createInitialVolumeState(): VolumeState {
  return {
    inputValue: '1',
    inputUnit: 'l'
  };
}

function createInitialTemperatureState(): TemperatureState {
  return {
    inputValue: '25',
    inputUnit: 'c'
  };
}

function createInitialSpeedState(): SpeedState {
  return {
    inputValue: '60',
    inputUnit: 'kmh'
  };
}

function createInitialCurrencyState(settings: AppSettings): CurrencyState {
  return {
    inputValue: settings.defaultCurrencyUnit === 'jpy' ? '10000' : '100',
    inputUnit: settings.defaultCurrencyUnit,
    mode: settings.defaultCurrencyMode
  };
}

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getToolPath(toolId: ToolId): string {
  return TOOL_ITEMS.find((tool) => tool.id === toolId)?.path ?? '/era-age';
}

function useHistoryAutosave<K extends ToolId>(
  toolId: K,
  state: ToolStateMap[K],
  enabled: boolean,
  onSave: (toolId: K, state: ToolStateMap[K]) => void
) {
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (!hasMounted.current) {
      hasMounted.current = true;
      return undefined;
    }

    const timer = window.setTimeout(() => onSave(toolId, state), HISTORY_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, onSave, state, toolId]);
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());
  const [lastUsedToolId, setLastUsedToolId] = useState<ToolId | null>(() => loadLastActiveTool());
  const [activeToolId, setActiveToolId] = useState<ToolId>('era-age');
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeInfoSection, setActiveInfoSection] = useState<InfoSectionId | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(() => loadHistoryEntries());
  const [eraAgeState, setEraAgeState] = useState<EraAgeState>(() => createInitialState());
  const [lengthState, setLengthState] = useState<LengthState>(() => createInitialLengthState());
  const [weightState, setWeightState] = useState<WeightState>(() => createInitialWeightState(settings));
  const [areaState, setAreaState] = useState<AreaState>(() => createInitialAreaState(settings));
  const [volumeState, setVolumeState] = useState<VolumeState>(() => createInitialVolumeState());
  const [temperatureState, setTemperatureState] = useState<TemperatureState>(() => createInitialTemperatureState());
  const [speedState, setSpeedState] = useState<SpeedState>(() => createInitialSpeedState());
  const [currencyState, setCurrencyState] = useState<CurrencyState>(() => createInitialCurrencyState(settings));

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  useEffect(() => {
    const syncOnlineState = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', syncOnlineState);
    window.addEventListener('offline', syncOnlineState);
    return () => {
      window.removeEventListener('online', syncOnlineState);
      window.removeEventListener('offline', syncOnlineState);
    };
  }, []);

  useEffect(() => {
    const matchedTool = TOOL_ITEMS.find((tool) => tool.path === location.pathname);
    if (matchedTool) {
      setActiveToolId(matchedTool.id);
      setLastUsedToolId(matchedTool.id);
      saveLastActiveTool(matchedTool.id);
    }
  }, [location.pathname]);

  const activeToolLabel = useMemo(
    () => TOOL_ITEMS.find((item) => item.id === activeToolId)?.label ?? '年齢・期間',
    [activeToolId]
  );

  const activeToolDescription = useMemo(
    () => TOOL_ITEMS.find((item) => item.id === activeToolId)?.description ?? TOOL_ITEMS[0].description,
    [activeToolId]
  );

  const commitHistoryEntries = useCallback((updater: (previous: HistoryEntry[]) => HistoryEntry[]) => {
    setHistoryEntries((previous) => {
      const next = updater(previous);
      saveHistoryEntries(next);
      return next;
    });
  }, []);

  const saveHistorySnapshot = useCallback(
    function saveHistorySnapshot<K extends ToolId>(toolId: K, state: ToolStateMap[K]) {
      commitHistoryEntries((previous) =>
        upsertHistoryEntry(previous, buildHistoryEntry(toolId, state), settings.historySaveCount)
      );
    },
    [commitHistoryEntries, settings.historySaveCount]
  );

  useHistoryAutosave('era-age', eraAgeState, settings.historyAutosave, saveHistorySnapshot);
  useHistoryAutosave('length', lengthState, settings.historyAutosave, saveHistorySnapshot);
  useHistoryAutosave('weight', weightState, settings.historyAutosave, saveHistorySnapshot);
  useHistoryAutosave('area', areaState, settings.historyAutosave, saveHistorySnapshot);
  useHistoryAutosave('volume', volumeState, settings.historyAutosave, saveHistorySnapshot);
  useHistoryAutosave('temperature', temperatureState, settings.historyAutosave, saveHistorySnapshot);
  useHistoryAutosave('speed', speedState, settings.historyAutosave, saveHistorySnapshot);
  useHistoryAutosave('currency', currencyState, settings.historyAutosave, saveHistorySnapshot);

  const handleOpenHistory = useCallback(() => {
    setIsSettingsOpen(false);
    setActiveInfoSection(null);
    setIsHistoryOpen(true);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setIsHistoryOpen(false);
    setActiveInfoSection(null);
    setIsSettingsOpen(true);
  }, []);

  const handleOpenInfo = useCallback((section: InfoSectionId) => {
    setIsHistoryOpen(false);
    setIsSettingsOpen(false);
    setActiveInfoSection(section);
  }, []);

  const handleRestoreHistory = useCallback(
    (entry: HistoryEntry) => {
      switch (entry.snapshot.toolId) {
        case 'era-age':
          setEraAgeState(cloneState(entry.snapshot.state as EraAgeState));
          break;
        case 'length':
          setLengthState(cloneState(entry.snapshot.state as LengthState));
          break;
        case 'weight':
          setWeightState(cloneState(entry.snapshot.state as WeightState));
          break;
        case 'area':
          setAreaState(cloneState(entry.snapshot.state as AreaState));
          break;
        case 'volume':
          setVolumeState(cloneState(entry.snapshot.state as VolumeState));
          break;
        case 'temperature':
          setTemperatureState(cloneState(entry.snapshot.state as TemperatureState));
          break;
        case 'speed':
          setSpeedState(cloneState(entry.snapshot.state as SpeedState));
          break;
        case 'currency':
          setCurrencyState(cloneState(entry.snapshot.state as CurrencyState));
          break;
      }

      const matchedTool = TOOL_ITEMS.find((tool) => tool.id === entry.toolId);
      if (matchedTool) {
        setActiveToolId(matchedTool.id);
        navigate(matchedTool.path);
      }

      setIsHistoryOpen(false);
    },
    [navigate]
  );

  const handleDeleteHistory = useCallback(
    (entryId: string) => {
      commitHistoryEntries((previous) => removeHistoryEntry(previous, entryId));
    },
    [commitHistoryEntries]
  );

  const handleClearHistory = useCallback(
    (toolId?: ToolId) => {
      commitHistoryEntries((previous) => clearHistoryEntries(previous, toolId));
    },
    [commitHistoryEntries]
  );

  const handleSettingsChange = useCallback((nextSettings: AppSettings) => {
    setSettings(nextSettings);
  }, []);

  const handleResetSettings = useCallback(() => {
    const nextSettings = createInitialSettings();
    setSettings(nextSettings);
  }, []);

  const currencyCooldownMs = useMemo(
    () => getCurrencyCooldownMs(settings.currencyCooldownMinutes),
    [settings.currencyCooldownMinutes]
  );
  const startupToolPath = useMemo(() => {
    if (settings.preferLastTool && lastUsedToolId) {
      return getToolPath(lastUsedToolId);
    }

    return getToolPath(settings.startupTool);
  }, [lastUsedToolId, settings.preferLastTool, settings.startupTool]);

  return (
    <Layout
      activeToolId={activeToolId}
      activeToolLabel={activeToolLabel}
      toolDescription={activeToolDescription}
      isOffline={isOffline}
      tools={TOOL_ITEMS}
      onToolChange={setActiveToolId}
      onOpenHistory={handleOpenHistory}
      onOpenSettings={handleOpenSettings}
      onOpenPrivacy={() => handleOpenInfo('privacy')}
      onOpenTerms={() => handleOpenInfo('terms')}
      onOpenCurrencyInfo={() => handleOpenInfo('currency')}
      onOpenContact={() => handleOpenInfo('contact')}
      historyDrawer={
        <HistoryDrawer
          open={isHistoryOpen}
          activeToolId={activeToolId}
          activeToolLabel={activeToolLabel}
          entries={historyEntries}
          onClose={() => setIsHistoryOpen(false)}
          onRestore={handleRestoreHistory}
          onDelete={handleDeleteHistory}
          onClear={handleClearHistory}
        />
      }
      settingsDrawer={
        <SettingsDrawer
          open={isSettingsOpen}
          settings={settings}
          tools={TOOL_ITEMS}
          onClose={() => setIsSettingsOpen(false)}
          onChange={handleSettingsChange}
          onReset={handleResetSettings}
        />
      }
      infoDrawer={
        activeInfoSection ? (
          <InfoDrawer
            open={activeInfoSection !== null}
            activeSection={activeInfoSection}
            onClose={() => setActiveInfoSection(null)}
            onSectionChange={setActiveInfoSection}
          />
        ) : undefined
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to={startupToolPath} replace />} />
        <Route
          path="/era-age"
          element={
            <EraAgeConverter
              state={eraAgeState}
              onReset={() => {
                const today = toDateParts(new Date());
                const nextState = {
                  baseDate: today,
                  targetDate: today,
                  baseInputMode: 'era' as const,
                  targetInputMode: 'era' as const,
                  result: computeEraAgeResult(today, today)
                };
                setActiveToolId('era-age');
                setEraAgeState(nextState);
              }}
              onStateChange={(nextState) => {
                setActiveToolId('era-age');
                setEraAgeState(nextState);
              }}
            />
          }
        />
        <Route
          path="/length"
          element={
            <LengthConverter
              state={lengthState}
              onReset={() => setLengthState(createInitialLengthState())}
              onStateChange={(nextState) => {
                setActiveToolId('length');
                setLengthState(nextState);
              }}
            />
          }
        />
        <Route
          path="/weight"
          element={
            <WeightConverter
              state={weightState}
              onReset={() => setWeightState(createInitialWeightState(settings))}
              onStateChange={(nextState) => {
                setActiveToolId('weight');
                setWeightState(nextState);
              }}
            />
          }
        />
        <Route
          path="/area"
          element={
            <AreaConverter
              state={areaState}
              onReset={() => setAreaState(createInitialAreaState(settings))}
              onStateChange={(nextState) => {
                setActiveToolId('area');
                setAreaState(nextState);
              }}
            />
          }
        />
        <Route
          path="/volume"
          element={
            <VolumeConverter
              state={volumeState}
              onReset={() => setVolumeState(createInitialVolumeState())}
              onStateChange={(nextState) => {
                setActiveToolId('volume');
                setVolumeState(nextState);
              }}
            />
          }
        />
        <Route
          path="/temperature"
          element={
            <TemperatureConverter
              state={temperatureState}
              onReset={() => setTemperatureState(createInitialTemperatureState())}
              onStateChange={(nextState) => {
                setActiveToolId('temperature');
                setTemperatureState(nextState);
              }}
            />
          }
        />
        <Route
          path="/speed"
          element={
            <SpeedConverter
              state={speedState}
              onReset={() => setSpeedState(createInitialSpeedState())}
              onStateChange={(nextState) => {
                setActiveToolId('speed');
                setSpeedState(nextState);
              }}
            />
          }
        />
        <Route
          path="/currency"
          element={
            <CurrencyConverter
              state={currencyState}
              cooldownMs={currencyCooldownMs}
              onReset={() => setCurrencyState(createInitialCurrencyState(settings))}
              onStateChange={(nextState) => {
                setActiveToolId('currency');
                setCurrencyState(nextState);
              }}
            />
          }
        />
      </Routes>
    </Layout>
  );
}
