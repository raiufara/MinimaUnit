import { useEffect, useMemo, useState } from 'react';
import {
  AREA_GROUPS,
  AREA_INPUT_UNITS,
  AREA_MODES,
  convertArea,
  formatAreaInput,
  formatAreaParts,
  getAreaMode,
  getAreaUnit,
  orderAreaUnits,
  parseAreaValue,
  sanitizeAreaInput,
  type AreaDisplayParts
} from '../lib/area';
import type { AreaState } from '../types';
import { ToolSummaryRow } from './ToolSummaryRow';

interface AreaConverterProps {
  state: AreaState;
  onStateChange: (nextState: AreaState) => void;
  onReset: () => void;
}

type FlashMessage = {
  tone: 'success' | 'error';
  text: string;
} | null;

const ROUNDING_INFO =
  '見やすさのため、一部の結果は小数点以下を丸めて表示しています（1未満は小数第6位まで、1以上は第4位まで、100以上は第2位まで、1000以上は整数表示）。';

const INPUT_UNIT_GROUPS = [
  { key: 'metric', label: 'メートル法' },
  { key: 'imperial', label: 'インペリアル法' },
  { key: 'traditional', label: '和式土地単位' }
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

function getResultValueClass(displayValue: string, variant: 'default' | 'traditional'): string {
  const adjustedLength = displayValue.length + (variant === 'traditional' ? 2 : 0);

  if (adjustedLength >= 15) {
    return 'xxx-tight';
  }

  if (adjustedLength >= 13) {
    return 'xx-tight';
  }

  if (adjustedLength >= 10) {
    return 'x-tight';
  }

  if (adjustedLength >= 8) {
    return 'tight';
  }

  return '';
}

function AreaResultTile({
  title,
  display,
  wide = false,
  variant = 'default'
}: {
  title: string;
  display: AreaDisplayParts;
  wide?: boolean;
  variant?: 'default' | 'traditional';
}) {
  const valueClass = getResultValueClass(display.text, variant);
  const className = [
    'length-result-tile',
    wide ? 'wide' : '',
    variant === 'traditional' ? 'traditional' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={className}>
      <span>{title}</span>
      <strong className={valueClass}>
        <span>{display.whole}</span>
        {display.fraction ? <small>.{display.fraction}</small> : null}
      </strong>
    </article>
  );
}

export function AreaConverter({ state, onStateChange, onReset }: AreaConverterProps) {
  const [flashMessage, setFlashMessage] = useState<FlashMessage>(null);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timer = window.setTimeout(() => setFlashMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const parsedValue = useMemo(() => parseAreaValue(state.inputValue), [state.inputValue]);
  const activeUnit = useMemo(() => getAreaUnit(state.inputUnit), [state.inputUnit]);
  const activeMode = useMemo(() => getAreaMode(state.mode), [state.mode]);
  const formattedInputValue = useMemo(() => formatAreaInput(state.inputValue), [state.inputValue]);
  const inputValueClass = useMemo(() => getInputValueClass(formattedInputValue), [formattedInputValue]);

  const groupedResults = useMemo(() => {
    const convertGroup = (units: typeof AREA_GROUPS.metric, order: (typeof activeMode.unitOrder)[keyof typeof activeMode.unitOrder]) =>
      orderAreaUnits(
        units.filter((unit) => unit.key !== state.inputUnit),
        order
      )
        .map((unit) => {
          const value = parsedValue === null ? null : convertArea(parsedValue, state.inputUnit, unit.key);
          return {
            ...unit,
            value,
            display: formatAreaParts(value)
          };
        });

    return {
      metric: convertGroup(AREA_GROUPS.metric, activeMode.unitOrder.metric),
      imperial: convertGroup(AREA_GROUPS.imperial, activeMode.unitOrder.imperial),
      traditional: convertGroup(AREA_GROUPS.traditional, activeMode.unitOrder.traditional)
    };
  }, [activeMode.unitOrder.imperial, activeMode.unitOrder.metric, activeMode.unitOrder.traditional, parsedValue, state.inputUnit]);

  const inputUnitGroups = useMemo(
    () =>
      INPUT_UNIT_GROUPS.map((group) => ({
        ...group,
        units: orderAreaUnits(
          AREA_INPUT_UNITS.filter((unit) => unit.system === group.key),
          activeMode.unitOrder[group.key]
        )
      })),
    [activeMode.unitOrder]
  );

  const hasRoundedResults = useMemo(
    () =>
      [...groupedResults.metric, ...groupedResults.imperial, ...groupedResults.traditional].some((unit) => unit.display.rounded),
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
      inputValue: sanitizeAreaInput(nextValue)
    });
  };

  const handleReset = () => {
    setFlashMessage(null);
    onReset();
  };

  const handleCopyResults = async () => {
    const sections = [
      `入力値: ${formattedInputValue || '-'} ${activeUnit.shortLabel}`,
      'メートル法',
      ...groupedResults.metric.map((unit) => `- ${unit.displayLabel}: ${unit.display.text}`),
      'インペリアル法',
      ...groupedResults.imperial.map((unit) => `- ${unit.displayLabel}: ${unit.display.text}`),
      '土地系和式',
      ...groupedResults.traditional.map((unit) => `- ${unit.displayLabel}: ${unit.display.text}`)
    ];

    try {
      await navigator.clipboard.writeText(sections.join('\n'));
      setFlashMessage({ tone: 'success', text: '計算結果をコピーしました。' });
    } catch {
      setFlashMessage({ tone: 'error', text: '結果のコピーに失敗しました。' });
    }
  };

  return (
    <div className="length-page area-page">
      <ToolSummaryRow badge={`${activeMode.label} / ${activeUnit.shortLabel}`} messages={topMessages} />

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
              {AREA_MODES.map((mode) => (
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
            <label className="length-section-label" htmlFor="area-value-input">
              数値入力
            </label>
            <div className="length-value-pill">
              <input
                id="area-value-input"
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
                  <div className="length-unit-row">
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
              <p className="length-group-label">メートル法</p>
              <div className="length-result-grid metric">
                {groupedResults.metric.map((unit, index) => (
                  <AreaResultTile
                    key={unit.key}
                    title={unit.displayLabel}
                    display={unit.display}
                    wide={groupedResults.metric.length % 2 === 1 && index === groupedResults.metric.length - 1}
                  />
                ))}
              </div>
            </div>

            <div className="length-group">
              <p className="length-group-label">インペリアル法</p>
              <div className="length-result-grid imperial">
                {groupedResults.imperial.map((unit, index) => (
                  <AreaResultTile
                    key={unit.key}
                    title={unit.displayLabel}
                    display={unit.display}
                    wide={groupedResults.imperial.length % 2 === 1 && index === groupedResults.imperial.length - 1}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="panel length-result-panel">
            <div className="length-panel-headline">
              <div className="length-panel-title">
                <span className="length-title-bar" aria-hidden="true" />
                <h3>土地系和式</h3>
              </div>
              <span className="length-badge">和式単位</span>
            </div>

            <div className="length-result-grid traditional">
              {groupedResults.traditional.map((unit) => (
                <AreaResultTile key={unit.key} title={unit.displayLabel} display={unit.display} variant="traditional" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
