import { useEffect, useMemo, useState } from 'react';
import {
  CURRENCY_GROUPS,
  CURRENCY_INPUT_UNITS,
  CURRENCY_MODES,
  CURRENCY_ROUNDING_NOTE,
  CURRENCY_UPDATE_COOLDOWN_MS,
  DEFAULT_CURRENCY_SNAPSHOT,
  convertCurrency,
  fetchLatestCurrencySnapshot,
  formatCurrencyInput,
  formatCurrencyParts,
  getCurrencyMode,
  getCurrencySnapshotAgeDays,
  getCurrencyUnit,
  loadStoredCurrencySnapshot,
  orderCurrencyUnits,
  parseCurrencyValue,
  saveCurrencySnapshot,
  sanitizeCurrencyInput,
  type CurrencyDisplayParts,
  type CurrencyRatesSnapshot
} from '../lib/currency';
import { ToolSummaryRow } from './ToolSummaryRow';
import type { CurrencyState } from '../types';

interface CurrencyConverterProps {
  state: CurrencyState;
  cooldownMs?: number;
  onStateChange: (nextState: CurrencyState) => void;
  onReset: () => void;
}

type FlashMessage = {
  tone: 'success' | 'info' | 'warning' | 'error';
  text: string;
} | null;

const INPUT_UNIT_GROUPS = [
  { key: 'major', label: '主要通貨' },
  { key: 'asia', label: 'アジア通貨' },
  { key: 'global', label: 'その他主要通貨' }
] as const;

function getInputValueClass(displayValue: string): string {
  if (displayValue.length >= 20) {
    return 'xx-tight';
  }

  if (displayValue.length >= 16) {
    return 'x-tight';
  }

  if (displayValue.length >= 12) {
    return 'tight';
  }

  return '';
}

function getResultValueClass(displayValue: string): string {
  if (displayValue.length >= 16) {
    return 'xxx-tight';
  }

  if (displayValue.length >= 13) {
    return 'xx-tight';
  }

  if (displayValue.length >= 10) {
    return 'x-tight';
  }

  if (displayValue.length >= 8) {
    return 'tight';
  }

  return '';
}

function formatFetchedTimestamp(timestamp: string): string {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return '未取得';
  }

  return parsed.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatCooldownLabel(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}分${seconds.toString().padStart(2, '0')}秒` : `${seconds}秒`;
}

function formatCooldownRequirement(cooldownMs: number): string {
  const totalMinutes = Math.round(cooldownMs / 60000);
  return `${totalMinutes}分`;
}

function CurrencyResultTile({
  title,
  display,
  wide = false
}: {
  title: string;
  display: CurrencyDisplayParts;
  wide?: boolean;
}) {
  const valueClass = getResultValueClass(display.text);

  return (
    <article className={wide ? 'length-result-tile wide' : 'length-result-tile'}>
      <span>{title}</span>
      <strong className={valueClass}>
        <span>{display.whole}</span>
        {display.fraction ? <small>.{display.fraction}</small> : null}
      </strong>
    </article>
  );
}

export function CurrencyConverter({
  state,
  cooldownMs = CURRENCY_UPDATE_COOLDOWN_MS,
  onStateChange,
  onReset
}: CurrencyConverterProps) {
  const [flashMessage, setFlashMessage] = useState<FlashMessage>(null);
  const [ratesSnapshot, setRatesSnapshot] = useState<CurrencyRatesSnapshot>(() => loadStoredCurrencySnapshot() ?? DEFAULT_CURRENCY_SNAPSHOT);
  const [isUpdating, setIsUpdating] = useState(false);
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timer = window.setTimeout(() => setFlashMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const cooldownRemaining = useMemo(() => {
    const fetchedAt = new Date(ratesSnapshot.fetchedAt).getTime();
    if (!Number.isFinite(fetchedAt)) {
      return 0;
    }

    return Math.max(0, fetchedAt + cooldownMs - tick);
  }, [cooldownMs, ratesSnapshot.fetchedAt, tick]);

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownRemaining]);

  const parsedValue = useMemo(() => parseCurrencyValue(state.inputValue), [state.inputValue]);
  const activeUnit = useMemo(() => getCurrencyUnit(state.inputUnit), [state.inputUnit]);
  const activeMode = useMemo(() => getCurrencyMode(state.mode), [state.mode]);
  const formattedInputValue = useMemo(() => formatCurrencyInput(state.inputValue), [state.inputValue]);
  const inputValueClass = useMemo(() => getInputValueClass(formattedInputValue), [formattedInputValue]);
  const rateAgeDays = useMemo(() => getCurrencySnapshotAgeDays(ratesSnapshot), [ratesSnapshot]);

  const groupedResults = useMemo(() => {
    const convertGroup = (
      units: typeof CURRENCY_GROUPS.major,
      order: (typeof activeMode.unitOrder)[keyof typeof activeMode.unitOrder]
    ) =>
      orderCurrencyUnits(
        units.filter((unit) => unit.key !== state.inputUnit),
        order
      ).map((unit) => {
        const value = parsedValue === null ? null : convertCurrency(parsedValue, state.inputUnit, unit.key, ratesSnapshot.rates);
        return {
          ...unit,
          value,
          display: formatCurrencyParts(value)
        };
      });

    return {
      major: convertGroup(CURRENCY_GROUPS.major, activeMode.unitOrder.major),
      asia: convertGroup(CURRENCY_GROUPS.asia, activeMode.unitOrder.asia),
      global: convertGroup(CURRENCY_GROUPS.global, activeMode.unitOrder.global)
    };
  }, [activeMode.unitOrder.asia, activeMode.unitOrder.global, activeMode.unitOrder.major, parsedValue, ratesSnapshot.rates, state.inputUnit]);

  const inputUnitGroups = useMemo(
    () =>
      INPUT_UNIT_GROUPS.map((group) => ({
        ...group,
        units: orderCurrencyUnits(
          CURRENCY_INPUT_UNITS.filter((unit) => unit.system === group.key),
          activeMode.unitOrder[group.key]
        )
      })),
    [activeMode.unitOrder]
  );

  const hasRoundedResults = useMemo(
    () => [...groupedResults.major, ...groupedResults.asia, ...groupedResults.global].some((unit) => unit.display.rounded),
    [groupedResults]
  );

  const freshnessMessage = useMemo(() => {
    if (rateAgeDays >= 8) {
      return {
        tone: 'warning' as const,
        text: `${ratesSnapshot.label}基準の参考レートです。少し古い可能性があるため、必要に応じて更新してください。`
      };
    }

    if (rateAgeDays >= 4) {
      return {
        tone: 'info' as const,
        text: `${ratesSnapshot.label}基準の参考レートです。必要に応じてレート更新で新しい基準日に切り替えられます。`
      };
    }

    return {
      tone: 'info' as const,
      text: `参考レート基準日: ${ratesSnapshot.label}。${ratesSnapshot.summary}`
    };
  }, [rateAgeDays, ratesSnapshot.label, ratesSnapshot.summary]);

  const topMessages = useMemo(() => {
    const messages: Array<{ tone: 'success' | 'info' | 'warning' | 'error'; text: string }> = [];

    if (flashMessage) {
      messages.push(flashMessage);
    }

    messages.push(freshnessMessage);

    if (parsedValue !== null && hasRoundedResults) {
      messages.push({ tone: 'info', text: CURRENCY_ROUNDING_NOTE });
    }

    return messages;
  }, [flashMessage, freshnessMessage, hasRoundedResults, parsedValue]);

  const handleInputChange = (nextValue: string) => {
    onStateChange({
      ...state,
      inputValue: sanitizeCurrencyInput(nextValue)
    });
  };

  const handleReset = () => {
    setFlashMessage(null);
    onReset();
  };

  const handleRateUpdate = async () => {
    if (isUpdating) {
      return;
    }

    if (cooldownRemaining > 0) {
      setFlashMessage({
        tone: 'info',
        text: `最終更新から${formatCooldownRequirement(cooldownMs)}は間隔を空けてください。次の更新まで ${formatCooldownLabel(cooldownRemaining)} です。`
      });
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setFlashMessage({ tone: 'error', text: 'オフラインのため更新できません。保存済みの参考レートを表示しています。' });
      return;
    }

    setIsUpdating(true);

    try {
      const nextSnapshot = await fetchLatestCurrencySnapshot(ratesSnapshot);
      setRatesSnapshot(nextSnapshot);
      saveCurrencySnapshot(nextSnapshot);
      setTick(Date.now());
      setFlashMessage({
        tone: 'success',
        text:
          nextSnapshot.twdDerivedFrom === 'cbc-usd-cross'
            ? `参考レートを更新しました。基準日は ${nextSnapshot.label} です。`
            : `参考レートを更新しました。TWD は保存済みの参考値を継続しています。`
      });
    } catch {
      setFlashMessage({ tone: 'error', text: 'レート更新に失敗しました。保存済みの参考レートを表示しています。' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyResults = async () => {
    const sections = [
      `入力額: ${formattedInputValue || '-'} ${activeUnit.shortLabel}`,
      `参考レート基準日: ${ratesSnapshot.label}`,
      `最終更新: ${formatFetchedTimestamp(ratesSnapshot.fetchedAt)}`,
      `ソース: ${ratesSnapshot.sourceLabel}`,
      `表示モード: ${activeMode.label}`,
      '主要通貨',
      ...groupedResults.major.map((unit) => `- ${unit.displayLabel}: ${unit.display.text}`),
      'アジア通貨',
      ...groupedResults.asia.map((unit) => `- ${unit.displayLabel}: ${unit.display.text}`),
      'その他主要通貨',
      ...groupedResults.global.map((unit) => `- ${unit.displayLabel}: ${unit.display.text}`)
    ];

    try {
      await navigator.clipboard.writeText(sections.join('\n'));
      setFlashMessage({ tone: 'success', text: '計算結果をコピーしました。' });
    } catch {
      setFlashMessage({ tone: 'error', text: '結果のコピーに失敗しました。' });
    }
  };

  return (
    <div className="length-page currency-page">
      <ToolSummaryRow badge={`参考基準 ${ratesSnapshot.label}`} messages={topMessages} />

      <div className="length-grid">
        <section className="panel length-input-panel">
          <div className="panel-head length-panel-head">
            <div className="length-panel-title">
              <span className="length-title-bar" aria-hidden="true" />
              <h3>入力設定</h3>
            </div>
            <button type="button" className="ghost-action" onClick={handleReset}>
              リセット
            </button>
          </div>

          <div className="length-input-block">
            <label className="length-section-label">表示モード</label>
            <div className="usage-mode-toggle">
              {CURRENCY_MODES.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  className={state.mode === mode.key ? 'usage-mode-button active' : 'usage-mode-button'}
                  onClick={() => onStateChange({ ...state, mode: mode.key })}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <p className="usage-mode-note">{activeMode.description}</p>
          </div>

          <div className="length-input-block">
            <label className="length-section-label" htmlFor="currency-value-input">
              金額入力
            </label>
            <div className="length-value-pill">
              <input
                id="currency-value-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                className={inputValueClass}
                value={formattedInputValue}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => handleInputChange(event.target.value)}
              />
              <span>{activeUnit.shortLabel}</span>
            </div>
          </div>

          <div className="length-input-block">
            <div className="currency-reference-card">
              <div className="currency-reference-meta">
                <p>
                  <span>基準日</span>
                  <strong>{ratesSnapshot.label}</strong>
                </p>
                <p>
                  <span>最終更新</span>
                  <strong>{formatFetchedTimestamp(ratesSnapshot.fetchedAt)}</strong>
                </p>
                <p>
                  <span>ソース</span>
                  <strong>{ratesSnapshot.sourceLabel}</strong>
                </p>
              </div>
              <button
                type="button"
                className="ghost-action highlight currency-update-button"
                onClick={handleRateUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? '更新中...' : cooldownRemaining > 0 ? `再更新まで ${formatCooldownLabel(cooldownRemaining)}` : 'レート更新'}
              </button>
            </div>
            <p className="currency-meta-note">
              TWD は {ratesSnapshot.twdDate} の台湾中銀 NT$/US$ 終値を使った推定値です。
            </p>
          </div>

          <div className="length-input-block">
            <label className="length-section-label">基準通貨を選択</label>
            <div className="length-unit-groups">
              {inputUnitGroups.map((group) => (
                <div key={group.key} className="length-unit-group">
                  <p className="length-unit-group-label">{group.label}</p>
                  <div className={`length-unit-row currency-unit-row ${group.key}`}>
                    {group.units.map((unit) => (
                      <button
                        key={unit.key}
                        type="button"
                        className={state.inputUnit === unit.key ? 'length-unit-button active' : 'length-unit-button'}
                        onClick={() => onStateChange({ ...state, inputUnit: unit.key })}
                      >
                        <span>{unit.label}</span>
                        {state.inputUnit === unit.key ? <em>✓</em> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="length-results-stack">
          <section className="panel length-result-panel">
            <div className="panel-head length-panel-head">
              <div className="length-panel-title">
                <span className="length-title-bar" aria-hidden="true" />
                <h3>計算結果</h3>
              </div>
              <button type="button" className="ghost-action highlight" onClick={handleCopyResults}>
                結果をコピー
              </button>
            </div>

            <div className="length-group">
              <p className="length-group-label">主要通貨</p>
              <div className="length-result-grid currency-result-grid major">
                {groupedResults.major.map((unit) => (
                  <CurrencyResultTile key={unit.key} title={unit.displayLabel} display={unit.display} />
                ))}
              </div>
            </div>

            <div className="length-group">
              <p className="length-group-label">アジア通貨</p>
              <div className="length-result-grid currency-result-grid asia">
                {groupedResults.asia.map((unit) => (
                  <CurrencyResultTile key={unit.key} title={unit.displayLabel} display={unit.display} />
                ))}
              </div>
            </div>

            <div className="length-group">
              <p className="length-group-label">その他主要通貨</p>
              <div className="length-result-grid currency-result-grid global">
                {groupedResults.global.map((unit) => (
                  <CurrencyResultTile key={unit.key} title={unit.displayLabel} display={unit.display} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
