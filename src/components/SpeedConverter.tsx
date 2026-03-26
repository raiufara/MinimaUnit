import { useEffect, useMemo, useState } from 'react';
import {
  convertSpeed,
  formatSpeedCompact,
  formatSpeedInput,
  formatSpeedParts,
  getSpeedUnit,
  parseSpeedValue,
  sanitizeSpeedInput,
  SPEED_GROUPS,
  SPEED_INPUT_UNITS,
  type SpeedDisplayParts
} from '../lib/speed';
import type { SpeedState } from '../types';
import { ToolSummaryRow } from './ToolSummaryRow';

interface SpeedConverterProps {
  state: SpeedState;
  onStateChange: (nextState: SpeedState) => void;
  onReset: () => void;
}

type FlashMessage = {
  tone: 'success' | 'error';
  text: string;
} | null;

const ROUNDING_INFO =
  '見やすさのため、一部の結果は小数点以下を丸めて表示しています（1未満は小数第6位まで、1以上は第4位まで、100以上は第2位まで、1000以上は整数表示）。';
const MACH_REFERENCE_NOTE = '音速は、乾燥空気 20℃ を基準に Mach 1 = 343.2 m/s として扱います。';
const LIGHTSPEED_NOTE = '光速選択時は、桁が大きい値を読みやすい尺度に整理し、補助換算は 万・億・兆 で短縮表示します。';
const LIGHTSPEED_PRIMARY_LABEL = '主要換算';
const LIGHTSPEED_SECONDARY_LABEL = '補助換算';

const INPUT_UNIT_GROUPS = [
  { key: 'everyday', label: '日常・交通' },
  { key: 'specialized', label: '航海・科学' }
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
  if (displayValue.length >= 15) {
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

function SpeedResultTile({
  title,
  display,
  wide = false
}: {
  title: string;
  display: SpeedDisplayParts;
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

function SpeedCompactTile({
  title,
  value
}: {
  title: string;
  value: string;
}) {
  const valueClass = getResultValueClass(value);

  return (
    <article className="length-result-tile speed-compact-tile">
      <span>{title}</span>
      <strong className={valueClass}>
        <span>{value}</span>
      </strong>
    </article>
  );
}

export function SpeedConverter({ state, onStateChange, onReset }: SpeedConverterProps) {
  const [flashMessage, setFlashMessage] = useState<FlashMessage>(null);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timer = window.setTimeout(() => setFlashMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const parsedValue = useMemo(() => parseSpeedValue(state.inputValue), [state.inputValue]);
  const activeUnit = useMemo(() => getSpeedUnit(state.inputUnit), [state.inputUnit]);
  const formattedInputValue = useMemo(() => formatSpeedInput(state.inputValue), [state.inputValue]);
  const inputValueClass = useMemo(() => getInputValueClass(formattedInputValue), [formattedInputValue]);

  const groupedResults = useMemo(() => {
    const convertGroup = (units: typeof SPEED_GROUPS.everyday) =>
      units
        .filter((unit) => unit.key !== state.inputUnit)
        .map((unit) => {
          const value = parsedValue === null ? null : convertSpeed(parsedValue, state.inputUnit, unit.key);
          return {
            ...unit,
            value,
            display: formatSpeedParts(value)
          };
        });

    return {
      everyday: convertGroup(SPEED_GROUPS.everyday),
      specialized: convertGroup(SPEED_GROUPS.specialized)
    };
  }, [parsedValue, state.inputUnit]);

  const isLightSpeedMode = state.inputUnit === 'lightspeed';

  const lightSpeedPrimaryResults = useMemo(() => {
    if (parsedValue === null || !isLightSpeedMode) {
      return [];
    }

    const metersPerSecond = convertSpeed(parsedValue, state.inputUnit, 'ms');
    return [
      { title: '光速 (c)', display: formatSpeedParts(convertSpeed(parsedValue, state.inputUnit, 'lightspeed')) },
      { title: 'キロ毎秒 (km/s)', display: formatSpeedParts(metersPerSecond / 1000) },
      { title: 'キロ毎時 (km/h)', display: formatSpeedParts(convertSpeed(parsedValue, state.inputUnit, 'kmh')) },
      { title: '音速 (Mach)', display: formatSpeedParts(convertSpeed(parsedValue, state.inputUnit, 'mach')) }
    ];
  }, [isLightSpeedMode, parsedValue, state.inputUnit]);

  const lightSpeedSecondaryResults = useMemo(() => {
    if (parsedValue === null || !isLightSpeedMode) {
      return [];
    }

    return [
      { title: 'マイル毎時 (mph)', value: `${formatSpeedCompact(convertSpeed(parsedValue, state.inputUnit, 'mph'))} mph` },
      { title: 'ノット (kt)', value: `${formatSpeedCompact(convertSpeed(parsedValue, state.inputUnit, 'knot'))} kt` },
      { title: 'フィート毎秒 (ft/s)', value: `${formatSpeedCompact(convertSpeed(parsedValue, state.inputUnit, 'fts'))} ft/s` },
      { title: 'メートル毎秒 (m/s)', value: `${formatSpeedCompact(convertSpeed(parsedValue, state.inputUnit, 'ms'))} m/s` }
    ];
  }, [isLightSpeedMode, parsedValue, state.inputUnit]);

  const inputUnitGroups = useMemo(
    () =>
      INPUT_UNIT_GROUPS.map((group) => ({
        ...group,
        units: SPEED_INPUT_UNITS.filter((unit) => unit.system === group.key)
      })),
    []
  );

  const hasRoundedResults = useMemo(
    () => [...groupedResults.everyday, ...groupedResults.specialized].some((unit) => unit.display.rounded),
    [groupedResults]
  );

  const topMessages = useMemo(() => {
    const messages: Array<{ tone: 'success' | 'info' | 'error'; text: string }> = [];

    if (flashMessage) {
      messages.push(flashMessage);
    }

    if (parsedValue !== null && hasRoundedResults) {
      messages.push({ tone: 'info', text: ROUNDING_INFO });
    }

    return messages;
  }, [flashMessage, hasRoundedResults, parsedValue]);

  const handleInputChange = (nextValue: string) => {
    onStateChange({
      ...state,
      inputValue: sanitizeSpeedInput(nextValue)
    });
  };

  const handleReset = () => {
    setFlashMessage(null);
    onReset();
  };

  const handleCopyResults = async () => {
    const sections = [
      `入力値: ${formattedInputValue || '-'} ${activeUnit.shortLabel}`,
      ...(isLightSpeedMode
        ? [
            LIGHTSPEED_PRIMARY_LABEL,
            ...lightSpeedPrimaryResults.map((unit) => `- ${unit.title}: ${unit.display.text}`),
            LIGHTSPEED_SECONDARY_LABEL,
            ...lightSpeedSecondaryResults.map((unit) => `- ${unit.title}: ${unit.value}`)
          ]
        : [
            '日常・交通',
            ...groupedResults.everyday.map((unit) => `- ${unit.displayLabel}: ${unit.display.text}`),
            '航海・科学',
            ...groupedResults.specialized.map((unit) => `- ${unit.displayLabel}: ${unit.display.text}`)
          ])
    ];

    try {
      await navigator.clipboard.writeText(sections.join('\n'));
      setFlashMessage({ tone: 'success', text: '計算結果をコピーしました。' });
    } catch {
      setFlashMessage({ tone: 'error', text: '結果のコピーに失敗しました。' });
    }
  };

  return (
    <div className="length-page speed-page">
      <ToolSummaryRow badge={`入力単位 ${activeUnit.shortLabel}`} messages={topMessages} />

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
            <label className="length-section-label" htmlFor="speed-value-input">
              数値入力
            </label>
            <div className="length-value-pill">
              <input
                id="speed-value-input"
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
            <label className="length-section-label">単位を選択</label>
            <div className="length-unit-groups">
              {inputUnitGroups.map((group) => (
                <div key={group.key} className="length-unit-group">
                  <p className="length-unit-group-label">{group.label}</p>
                  <div className={`length-unit-row speed-unit-row ${group.key}`}>
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
            <p className="usage-mode-note">{MACH_REFERENCE_NOTE}</p>
            {isLightSpeedMode ? <p className="usage-mode-note">{LIGHTSPEED_NOTE}</p> : null}
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

            {isLightSpeedMode ? (
              <>
                <div className="length-group">
                  <p className="length-group-label">{LIGHTSPEED_PRIMARY_LABEL}</p>
                  <div className="speed-cosmic-grid">
                    {lightSpeedPrimaryResults.map((unit) => (
                      <SpeedResultTile key={unit.title} title={unit.title} display={unit.display} />
                    ))}
                  </div>
                </div>

                <div className="length-group">
                  <p className="length-group-label">{LIGHTSPEED_SECONDARY_LABEL}</p>
                  <div className="speed-cosmic-grid compact">
                    {lightSpeedSecondaryResults.map((unit) => (
                      <SpeedCompactTile key={unit.title} title={unit.title} value={unit.value} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="length-group">
                  <p className="length-group-label">日常・交通</p>
                  <div className="length-result-grid imperial">
                    {groupedResults.everyday.map((unit) => (
                      <SpeedResultTile key={unit.key} title={unit.displayLabel} display={unit.display} />
                    ))}
                  </div>
                </div>

                <div className="length-group">
                  <p className="length-group-label">航海・科学</p>
                  <div className="length-result-grid metric">
                    {groupedResults.specialized.map((unit, index) => (
                      <SpeedResultTile
                        key={unit.key}
                        title={unit.displayLabel}
                        display={unit.display}
                        wide={groupedResults.specialized.length % 2 === 1 && index === groupedResults.specialized.length - 1}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
