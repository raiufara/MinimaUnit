import { useEffect, useMemo, useState } from 'react';
import {
  convertTemperature,
  formatTemperatureInput,
  formatTemperatureParts,
  getTemperatureUnit,
  parseTemperatureValue,
  sanitizeTemperatureInput,
  TEMPERATURE_GROUPS,
  TEMPERATURE_INPUT_UNITS,
  validateTemperatureInput,
  type TemperatureDisplayParts
} from '../lib/temperature';
import type { TemperatureState } from '../types';
import { ToolSummaryRow } from './ToolSummaryRow';

interface TemperatureConverterProps {
  state: TemperatureState;
  onStateChange: (nextState: TemperatureState) => void;
  onReset: () => void;
}

type FlashMessage = {
  tone: 'success' | 'error';
  text: string;
} | null;

const ROUNDING_INFO =
  '見やすさのため、一部の結果は小数点以下を丸めて表示しています（1未満は小数第6位まで、1以上は第4位まで、100以上は第2位まで、1000以上は整数表示）。';

const INPUT_UNIT_GROUPS = [
  { key: 'daily', label: '日常温度' },
  { key: 'scientific', label: '科学・工学' }
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

function TemperatureResultTile({
  title,
  display,
  wide = false
}: {
  title: string;
  display: TemperatureDisplayParts;
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

export function TemperatureConverter({ state, onStateChange, onReset }: TemperatureConverterProps) {
  const [flashMessage, setFlashMessage] = useState<FlashMessage>(null);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timer = window.setTimeout(() => setFlashMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const parsedValue = useMemo(() => parseTemperatureValue(state.inputValue), [state.inputValue]);
  const activeUnit = useMemo(() => getTemperatureUnit(state.inputUnit), [state.inputUnit]);
  const formattedInputValue = useMemo(() => formatTemperatureInput(state.inputValue), [state.inputValue]);
  const inputValueClass = useMemo(() => getInputValueClass(formattedInputValue), [formattedInputValue]);
  const validationErrors = useMemo(() => validateTemperatureInput(parsedValue, state.inputUnit), [parsedValue, state.inputUnit]);
  const canConvert = validationErrors.length === 0;

  const groupedResults = useMemo(() => {
    const convertGroup = (units: typeof TEMPERATURE_GROUPS.daily) =>
      units
        .filter((unit) => unit.key !== state.inputUnit)
        .map((unit) => {
          const value = parsedValue === null || !canConvert ? null : convertTemperature(parsedValue, state.inputUnit, unit.key);
          return {
            ...unit,
            value,
            display: formatTemperatureParts(value)
          };
        });

    return {
      daily: convertGroup(TEMPERATURE_GROUPS.daily),
      scientific: convertGroup(TEMPERATURE_GROUPS.scientific)
    };
  }, [canConvert, parsedValue, state.inputUnit]);

  const inputUnitGroups = useMemo(
    () =>
      INPUT_UNIT_GROUPS.map((group) => ({
        ...group,
        units: TEMPERATURE_INPUT_UNITS.filter((unit) => unit.system === group.key)
      })),
    []
  );

  const hasRoundedResults = useMemo(
    () => [...groupedResults.daily, ...groupedResults.scientific].some((unit) => unit.display.rounded),
    [groupedResults]
  );

  const topMessages = useMemo(() => {
    const messages: Array<{ tone: 'success' | 'info' | 'error'; text: string }> = [];

    if (flashMessage) {
      messages.push(flashMessage);
    }

    validationErrors.forEach((message) => messages.push({ tone: 'error', text: message }));

    if (parsedValue !== null && canConvert && hasRoundedResults) {
      messages.push({ tone: 'info', text: ROUNDING_INFO });
    }

    return messages;
  }, [canConvert, flashMessage, hasRoundedResults, parsedValue, validationErrors]);

  const handleInputChange = (nextValue: string) => {
    onStateChange({
      ...state,
      inputValue: sanitizeTemperatureInput(nextValue)
    });
  };

  const handleReset = () => {
    setFlashMessage(null);
    onReset();
  };

  const handleCopyResults = async () => {
    const sections = [
      `入力値: ${formattedInputValue || '-'} ${activeUnit.shortLabel}`,
      '日常スケール',
      ...groupedResults.daily.map((unit) => `- ${unit.displayLabel}: ${unit.display.text}`),
      '科学・工学',
      ...groupedResults.scientific.map((unit) => `- ${unit.displayLabel}: ${unit.display.text}`)
    ];

    try {
      await navigator.clipboard.writeText(sections.join('\n'));
      setFlashMessage({ tone: 'success', text: '計算結果をコピーしました。' });
    } catch {
      setFlashMessage({ tone: 'error', text: '結果のコピーに失敗しました。' });
    }
  };

  return (
    <div className="length-page temperature-page">
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
            <label className="length-section-label" htmlFor="temperature-value-input">
              数値入力
            </label>
            <div className="length-value-pill">
              <input
                id="temperature-value-input"
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
                  <div className="length-unit-row temperature-unit-row">
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
              <p className="length-group-label">日常スケール</p>
              <div className="length-result-grid metric">
                {groupedResults.daily.map((unit, index) => (
                  <TemperatureResultTile
                    key={unit.key}
                    title={unit.displayLabel}
                    display={unit.display}
                    wide={groupedResults.daily.length % 2 === 1 && index === groupedResults.daily.length - 1}
                  />
                ))}
              </div>
            </div>

            <div className="length-group">
              <p className="length-group-label">科学・工学</p>
              <div className="length-result-grid metric">
                {groupedResults.scientific.map((unit, index) => (
                  <TemperatureResultTile
                    key={unit.key}
                    title={unit.displayLabel}
                    display={unit.display}
                    wide={groupedResults.scientific.length % 2 === 1 && index === groupedResults.scientific.length - 1}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
