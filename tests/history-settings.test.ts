import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_APP_SETTINGS,
  LAST_ACTIVE_TOOL_STORAGE_KEY,
  createInitialSettings,
  getCurrencyCooldownMs,
  loadAppSettings,
  loadLastActiveTool,
  saveAppSettings,
  saveLastActiveTool
} from '../src/lib/settings';
import {
  buildHistoryEntry,
  clearHistoryEntries,
  DEFAULT_HISTORY_SAVE_COUNT,
  HISTORY_STORAGE_KEY,
  loadHistoryEntries,
  removeHistoryEntry,
  saveHistoryEntries,
  upsertHistoryEntry
} from '../src/lib/history';
import { installMockWindow, uninstallMockWindow } from './helpers/mockStorage';

describe('settings persistence', () => {
  beforeEach(() => {
    installMockWindow();
  });

  afterEach(() => {
    uninstallMockWindow();
  });

  it('returns defaults when nothing valid is stored', () => {
    expect(loadAppSettings()).toEqual(DEFAULT_APP_SETTINGS);
    window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, '{bad json');
    expect(loadAppSettings()).toEqual(DEFAULT_APP_SETTINGS);
  });

  it('saves and restores valid settings', () => {
    const next = {
      ...createInitialSettings(),
      startupTool: 'currency' as const,
      historyAutosave: false,
      historySaveCount: 20 as const,
      defaultCurrencyMode: 'business' as const
    };

    saveAppSettings(next);

    expect(loadAppSettings()).toEqual(next);
    expect(getCurrencyCooldownMs(10)).toBe(600000);
  });

  it('stores the last active tool only when the id is valid', () => {
    expect(loadLastActiveTool()).toBeNull();

    saveLastActiveTool('speed');
    expect(loadLastActiveTool()).toBe('speed');

    window.localStorage.setItem(LAST_ACTIVE_TOOL_STORAGE_KEY, 'unknown-tool');
    expect(loadLastActiveTool()).toBeNull();
  });
});

describe('history persistence', () => {
  beforeEach(() => {
    installMockWindow();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-23T09:30:00Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    uninstallMockWindow();
  });

  it('builds entries with deep-cloned snapshots', () => {
    const state = { inputValue: '12.5', inputUnit: 'm' as const };
    const entry = buildHistoryEntry('length', state);

    state.inputValue = '99';

    expect(entry.toolId).toBe('length');
    expect(entry.snapshot.state).toEqual({ inputValue: '12.5', inputUnit: 'm' });
    expect(entry.savedAt).toBe('2026-03-23T09:30:00.000Z');
  });

  it('skips duplicate consecutive states and trims entries per tool', () => {
    const first = buildHistoryEntry('length', { inputValue: '1', inputUnit: 'm' });
    const duplicate = buildHistoryEntry('length', { inputValue: '1', inputUnit: 'm' });
    const second = buildHistoryEntry('length', { inputValue: '2', inputUnit: 'm' });

    const withDuplicateSkipped = upsertHistoryEntry([first], duplicate, 5);
    expect(withDuplicateSkipped).toEqual([first]);

    const trimmed = upsertHistoryEntry(
      [
        buildHistoryEntry('length', { inputValue: '6', inputUnit: 'm' }),
        buildHistoryEntry('length', { inputValue: '5', inputUnit: 'm' }),
        buildHistoryEntry('length', { inputValue: '4', inputUnit: 'm' }),
        buildHistoryEntry('length', { inputValue: '3', inputUnit: 'm' }),
        buildHistoryEntry('length', { inputValue: '2', inputUnit: 'm' })
      ],
      second,
      5
    );

    expect(trimmed).toHaveLength(5);
    expect(trimmed[0].snapshot.state).toEqual({ inputValue: '2', inputUnit: 'm' });
  });

  it('saves, loads, removes, and clears entries', () => {
    const entries = [
      buildHistoryEntry('length', { inputValue: '25', inputUnit: 'cm' }),
      buildHistoryEntry('speed', { inputValue: '80', inputUnit: 'kmh' })
    ];

    saveHistoryEntries(entries);
    expect(loadHistoryEntries()).toHaveLength(2);

    const afterRemove = removeHistoryEntry(entries, entries[0].id);
    expect(afterRemove).toEqual([entries[1]]);

    expect(clearHistoryEntries(entries, 'length')).toEqual([entries[1]]);
    expect(clearHistoryEntries(entries)).toEqual([]);
    expect(DEFAULT_HISTORY_SAVE_COUNT).toBe(10);
    expect(window.localStorage.getItem(HISTORY_STORAGE_KEY)).not.toBeNull();
  });
});
