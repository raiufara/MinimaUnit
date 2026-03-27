import { useEffect } from 'react';
import { CURRENCY_COOLDOWN_OPTIONS, HISTORY_SAVE_COUNT_OPTIONS } from '../lib/settings';
import type { AppSettings, ToolId } from '../types';

interface ToolOption {
  id: ToolId;
  label: string;
  enabled: boolean;
}

interface SettingsDrawerProps {
  open: boolean;
  settings: AppSettings;
  tools: readonly ToolOption[];
  onClose: () => void;
  onChange: (nextSettings: AppSettings) => void;
  onReset: () => void;
}

const THEME_MODE_OPTIONS = [
  { key: 'light', label: 'ライト' },
  { key: 'dark', label: 'ダーク' },
  { key: 'system', label: 'システム' }
] as const;

const WEIGHT_MODE_OPTIONS = [
  { key: 'standard', label: '標準' },
  { key: 'logistics', label: '物流' },
  { key: 'cooking', label: '料理' }
] as const;

const AREA_MODE_OPTIONS = [
  { key: 'standard', label: '標準' },
  { key: 'real-estate', label: '不動産' },
  { key: 'farmland', label: '農地' }
] as const;

const CURRENCY_MODE_OPTIONS = [
  { key: 'standard', label: '標準' },
  { key: 'travel', label: '旅行' },
  { key: 'business', label: '業務' }
] as const;

const CURRENCY_UNIT_OPTIONS = [
  { key: 'jpy', label: 'JPY' },
  { key: 'usd', label: 'USD' },
  { key: 'eur', label: 'EUR' },
  { key: 'cny', label: 'CNY' },
  { key: 'krw', label: 'KRW' },
  { key: 'twd', label: 'TWD' },
  { key: 'thb', label: 'THB' },
  { key: 'sgd', label: 'SGD' },
  { key: 'hkd', label: 'HKD' },
  { key: 'gbp', label: 'GBP' },
  { key: 'aud', label: 'AUD' }
] as const;

export function SettingsDrawer({ open, settings, tools, onClose, onChange, onReset }: SettingsDrawerProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="settings-overlay" role="presentation" onClick={onClose}>
      <aside
        className="settings-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="設定"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-drawer-head">
          <div className="settings-drawer-title">
            <p className="top-label">App Preferences</p>
            <h3>設定</h3>
          </div>
          <button
            type="button"
            className="header-icon-button history-close-button"
            aria-label="設定を閉じる"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <p className="settings-intro">
          表示テーマや起動ツール、履歴の扱い、各ツールの既定モードをこの端末に保存します。あとで見直しやすいよう、
          全体設定とツール別設定を分けて調整できます。
        </p>

        <div className="settings-section">
          <div className="settings-section-head">
            <h4>全体</h4>
            <p>アプリ全体の使い方と表示テーマを整えます。</p>
          </div>

          <div className="settings-field">
            <label>テーマ</label>
            <div className="settings-chip-row">
              {THEME_MODE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={settings.themeMode === option.key ? 'settings-chip active' : 'settings-chip'}
                  onClick={() => onChange({ ...settings, themeMode: option.key })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <label>起動時に開くツール</label>
            <div className="settings-chip-grid tool-startup-grid">
              {tools
                .filter((tool) => tool.enabled)
                .map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    className={settings.startupTool === tool.id ? 'settings-chip active' : 'settings-chip'}
                    onClick={() => onChange({ ...settings, startupTool: tool.id })}
                  >
                    {tool.label}
                  </button>
                ))}
            </div>
          </div>

          <div className="settings-field">
            <label>履歴の自動保存</label>
            <div className="settings-chip-row">
              <button
                type="button"
                className={settings.historyAutosave ? 'settings-chip active' : 'settings-chip'}
                onClick={() => onChange({ ...settings, historyAutosave: true })}
              >
                保存する
              </button>
              <button
                type="button"
                className={!settings.historyAutosave ? 'settings-chip active' : 'settings-chip'}
                onClick={() => onChange({ ...settings, historyAutosave: false })}
              >
                保存しない
              </button>
            </div>
          </div>

          <div className="settings-field">
            <label>起動時に前回使ったツールを優先</label>
            <div className="settings-chip-row">
              <button
                type="button"
                className={settings.preferLastTool ? 'settings-chip active' : 'settings-chip'}
                onClick={() => onChange({ ...settings, preferLastTool: true })}
              >
                優先する
              </button>
              <button
                type="button"
                className={!settings.preferLastTool ? 'settings-chip active' : 'settings-chip'}
                onClick={() => onChange({ ...settings, preferLastTool: false })}
              >
                優先しない
              </button>
            </div>
          </div>

          <div className="settings-field">
            <label>履歴の保存件数</label>
            <div className="settings-chip-row">
              {HISTORY_SAVE_COUNT_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={settings.historySaveCount === count ? 'settings-chip active' : 'settings-chip'}
                  onClick={() => onChange({ ...settings, historySaveCount: count })}
                >
                  各ツール {count}件
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-head">
            <h4>ツール既定値</h4>
            <p>各ツールの初期モードを整えます。</p>
          </div>

          <div className="settings-field">
            <label>重さの既定モード</label>
            <div className="settings-chip-row">
              {WEIGHT_MODE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={settings.defaultWeightMode === option.key ? 'settings-chip active' : 'settings-chip'}
                  onClick={() => onChange({ ...settings, defaultWeightMode: option.key })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <label>面積の既定モード</label>
            <div className="settings-chip-row">
              {AREA_MODE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={settings.defaultAreaMode === option.key ? 'settings-chip active' : 'settings-chip'}
                  onClick={() => onChange({ ...settings, defaultAreaMode: option.key })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <label>通貨の既定モード</label>
            <div className="settings-chip-row">
              {CURRENCY_MODE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={settings.defaultCurrencyMode === option.key ? 'settings-chip active' : 'settings-chip'}
                  onClick={() => onChange({ ...settings, defaultCurrencyMode: option.key })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-field">
            <label>通貨の基準通貨</label>
            <div className="settings-chip-grid currency-base-grid">
              {CURRENCY_UNIT_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={settings.defaultCurrencyUnit === option.key ? 'settings-chip compact active' : 'settings-chip compact'}
                  onClick={() => onChange({ ...settings, defaultCurrencyUnit: option.key })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-head">
            <h4>通貨</h4>
            <p>参考レート更新の間隔を調整します。</p>
          </div>

          <div className="settings-field">
            <label>レート更新のクールダウン</label>
            <div className="settings-chip-row">
              {CURRENCY_COOLDOWN_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={settings.currencyCooldownMinutes === minutes ? 'settings-chip active' : 'settings-chip'}
                  onClick={() => onChange({ ...settings, currencyCooldownMinutes: minutes })}
                >
                  {minutes}分
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button type="button" className="history-clear-button" onClick={onReset}>
            設定を初期化
          </button>
        </div>
      </aside>
    </div>
  );
}
