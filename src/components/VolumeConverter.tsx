import { useEffect, useMemo, useState } from 'react';
import {
  VOLUME_GROUPS,
  VOLUME_INPUT_UNITS,
  convertVolume,
  formatVolumeInput,
  formatVolumeParts,
  getVolumeUnit,
  parseVolumeValue,
  sanitizeVolumeInput,
  type VolumeDisplayParts
} from '../lib/volume';
import type { VolumeState } from '../types';
import { ToolSummaryRow } from './ToolSummaryRow';

interface VolumeConverterProps {
  state: VolumeState;
  onStateChange: (nextState: VolumeState) => void;
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
  { key: 'imperial', label: '液量系インペリアル' },
  { key: 'traditional', label: '尺貫法' }
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

function VolumeResultTile({
  title,
  display,
  wide = false,
  variant = 'default'
}: {
  title: string;
  display: VolumeDisplayParts;
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

export function VolumeConverter({ state, onStateChange, onReset }: VolumeConverterProps) {
  const [flashMessage, setFlashMessage] = useState<FlashMessage>(null);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timer = window.setTimeout(() => setFlashMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const parsedValue = useMemo(() => parseVolumeValue(state.inputValue), [state.inputValue]);
  const activeUnit = useMemo(() => getVolumeUnit(state.inputUnit), [state.inputUnit]);
  const formattedInputValue = useMemo(() => formatVolumeInput(state.inputValue), [state.inputValue]);
  const inputValueClass = useMemo(() => getInputValueClass(formattedInputValue), [formattedInputValue]);

  const groupedResults = useMemo(() => {
    const convertGroup = (units: typeof VOLUME_GROUPS.metric) =>
      units
        .filter((unit) => unit.key !== state.inputUnit)
        .map((unit) => {
          const value = parsedValue === null ? null : convertVolume(parsedValue, state.inputUnit, unit.key);
          return {
            ...unit,
            value,
            display: formatVolumeParts(value)
          };
        });

    return {
      metric: convertGroup(VOLUME_GROUPS.metric),
      imperial: convertGroup(VOLUME_GROUPS.imperial),
      traditional: convertGroup(VOLUME_GROUPS.traditional)
    };
  }, [parsedValue, state.inputUnit]);

  const inputUnitGroups = useMemo(
    () =>
      INPUT_UNIT_GROUPS.map((group) => ({
        ...group,
        units: VOLUME_INPUT_UNITS.filter((unit) => unit.system === group.key)
      })),
    []
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
      inputValue: sanitizeVolumeInput(nextValue)
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
      '尺貫法',
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
    <div className="length-page volume-page">
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
            <label className="length-section-label" htmlFor="volume-value-input">
              数値入力
            </label>
            <div className="length-value-pill">
              <input
                id="volume-value-input"
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
                  <VolumeResultTile
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
                  <VolumeResultTile
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
                <h3>尺貫法</h3>
              </div>
              <span className="length-badge">伝統単位</span>
            </div>

            <div className="length-result-grid traditional">
              {groupedResults.traditional.map((unit) => (
                <VolumeResultTile key={unit.key} title={unit.displayLabel} display={unit.display} variant="traditional" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
