import type { ChangeEvent, FocusEvent, MutableRefObject } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  computeEraAgeResult,
  deriveAgeModeBaseDate,
  deriveAgeModeTargetDate,
  formatEraYearLabel,
  getEraPeriodLabels,
  normalizeToGregorian,
  resolveModeInput,
  toDateParts
} from '../lib/era';
import type { DateInput, EraAgeState, EraType, InputMode } from '../types';

const JAPANESE_ERA_OPTIONS: Array<{ value: Exclude<EraType, 'gregorian'>; label: string }> = [
  { value: 'reiwa', label: '令和' },
  { value: 'heisei', label: '平成' },
  { value: 'showa', label: '昭和' },
  { value: 'taisho', label: '大正' },
  { value: 'meiji', label: '明治' }
];

const ERA_PERIOD_LABELS = getEraPeriodLabels();

interface EraAgeConverterProps {
  state: EraAgeState;
  onStateChange: (nextState: EraAgeState) => void;
  onReset: () => void;
}

function formatNumber(value: number | null, suffix = ''): string {
  if (value === null) {
    return '-';
  }

  return `${value.toLocaleString('ja-JP')}${suffix}`;
}

function buildResult(state: EraAgeState) {
  if (state.baseInputMode === 'age' && state.targetInputMode === 'age') {
    return {
      ...state.result,
      age: null,
      duration: {
        years: null,
        months: null,
        days: null,
        totalMonths: null,
        totalDays: null
      },
      warnings: [],
      errors: ['基準日と対象日の両方を年齢入力にはできません。']
    };
  }

  let baseDate = resolveModeInput(state.baseDate, state.baseInputMode);
  let targetDate = resolveModeInput(state.targetDate, state.targetInputMode);

  if (state.baseInputMode === 'age') {
    const derivedBase = deriveAgeModeBaseDate(targetDate, state.baseDate.year);
    if (!derivedBase) {
      return {
        ...state.result,
        age: null,
        duration: {
          years: null,
          months: null,
          days: null,
          totalMonths: null,
          totalDays: null
        },
        warnings: [],
        errors: ['対象日から年齢を逆算できません。']
      };
    }
    baseDate = derivedBase;
  }

  if (state.targetInputMode === 'age') {
    const derivedTarget = deriveAgeModeTargetDate(baseDate, state.targetDate.year);
    if (!derivedTarget) {
      return {
        ...state.result,
        age: null,
        duration: {
          years: null,
          months: null,
          days: null,
          totalMonths: null,
          totalDays: null
        },
        warnings: [],
        errors: ['基準日から年齢を加算できません。']
      };
    }
    targetDate = derivedTarget;
  }

  return computeEraAgeResult(baseDate, targetDate);
}

function ModeToggle({
  granularity,
  onChange,
  disabledDate,
  dateToggleRef,
  yearToggleRef
}: {
  granularity: 'year' | 'date';
  onChange: (next: 'year' | 'date') => void;
  disabledDate?: boolean;
  dateToggleRef?: MutableRefObject<HTMLButtonElement | null>;
  yearToggleRef?: MutableRefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className="mode-toggle">
      <button
        ref={dateToggleRef}
        type="button"
        className={granularity === 'date' ? 'mode-toggle-button active' : 'mode-toggle-button'}
        onClick={() => onChange('date')}
        disabled={disabledDate}
      >
        年月日
      </button>
      <button
        ref={yearToggleRef}
        type="button"
        className={granularity === 'year' ? 'mode-toggle-button active' : 'mode-toggle-button'}
        onClick={() => onChange('year')}
      >
        年のみ
      </button>
    </div>
  );
}

function EraButtons({
  value,
  inputMode,
  onEraSelect,
  onModeSelect
}: {
  value: EraType;
  inputMode: InputMode;
  onEraSelect: (next: Exclude<EraType, 'gregorian'>) => void;
  onModeSelect: (mode: InputMode) => void;
}) {
  return (
    <>
      <div className="era-button-grid">
        {JAPANESE_ERA_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={inputMode === 'era' && value === option.value ? 'era-button active' : 'era-button'}
            onClick={() => onEraSelect(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="aux-button-row">
        <button
          type="button"
          className={inputMode === 'gregorian' ? 'aux-chip active' : 'aux-chip'}
          onClick={() => onModeSelect('gregorian')}
        >
          西暦
        </button>
        <button
          type="button"
          className={inputMode === 'age' ? 'aux-chip active' : 'aux-chip'}
          onClick={() => onModeSelect('age')}
        >
          年齢
        </button>
      </div>
    </>
  );
}

function NumberField({
  label,
  value,
  suffix,
  min,
  max,
  onChange
}: {
  label: string;
  value: number | undefined;
  suffix: string;
  min: number;
  max?: number;
  onChange: (next: number) => void;
}) {
  const [draftValue, setDraftValue] = useState(value?.toString() ?? '');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraftValue(value?.toString() ?? '');
    }
  }, [isFocused, value]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const normalizedValue = event.target.value.replace(/[^\d]/g, '');
    setDraftValue(normalizedValue);

    if (normalizedValue === '') {
      return;
    }

    onChange(Number(normalizedValue));
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    requestAnimationFrame(() => {
      event.currentTarget.select();
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (draftValue === '') {
      setDraftValue(value?.toString() ?? '');
    }
  };

  return (
    <label className="number-field">
      <span>{label}</span>
      <div className="number-field-input">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          min={min}
          max={max}
          value={draftValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          aria-label={label}
        />
        <em>{suffix}</em>
      </div>
    </label>
  );
}

function InputSection({
  title,
  value,
  helperText,
  inputMode,
  onChange,
  onInputModeChange,
  onGranularityChange,
  dateToggleRef,
  yearToggleRef
}: {
  title: string;
  value: DateInput;
  helperText: string;
  inputMode: InputMode;
  onChange: (nextDate: DateInput) => void;
  onInputModeChange: (mode: InputMode) => void;
  onGranularityChange: (granularity: 'year' | 'date') => void;
  dateToggleRef?: MutableRefObject<HTMLButtonElement | null>;
  yearToggleRef?: MutableRefObject<HTMLButtonElement | null>;
}) {
  const granularity = value.granularity ?? 'date';
  const effectiveHelperText =
    inputMode === 'age'
      ? `${helperText} 年齢入力では年数から自動換算します。`
      : helperText;

  return (
    <section className="input-section">
      <div className="input-section-head">
        <label className="input-section-label">{title}</label>
        <ModeToggle
          granularity={granularity}
          onChange={onGranularityChange}
          disabledDate={inputMode === 'age'}
          dateToggleRef={dateToggleRef}
          yearToggleRef={yearToggleRef}
        />
      </div>

      <EraButtons
        value={value.era}
        inputMode={inputMode}
        onEraSelect={(nextEra) => {
          onInputModeChange('era');
          onChange({ ...value, era: nextEra });
        }}
        onModeSelect={onInputModeChange}
      />

      <div className={granularity === 'date' && inputMode !== 'age' ? 'field-row date' : 'field-row year'}>
        <NumberField
          label={inputMode === 'age' ? '年齢' : '年'}
          value={value.year}
          suffix={inputMode === 'age' ? '歳' : '年'}
          min={1}
          onChange={(next) => onChange({ ...value, year: next })}
        />
        {granularity === 'date' && inputMode !== 'age' ? (
          <>
            <NumberField
              label="月"
              value={value.month}
              suffix="月"
              min={1}
              max={12}
              onChange={(next) => onChange({ ...value, month: next })}
            />
            <NumberField
              label="日"
              value={value.day}
              suffix="日"
              min={1}
              max={31}
              onChange={(next) => onChange({ ...value, day: next })}
            />
          </>
        ) : (
          <>
            <div className="number-field-spacer" aria-hidden="true" />
            <div className="number-field-spacer" aria-hidden="true" />
          </>
        )}
      </div>

      <p className="input-section-note">{effectiveHelperText}</p>
    </section>
  );
}

function ResultCard({
  title,
  value,
  sublabel,
  wide = false
}: {
  title: string;
  value: string;
  sublabel?: string;
  wide?: boolean;
}) {
  return (
    <article className={wide ? 'result-card-block wide' : 'result-card-block'}>
      <span className="result-card-label">{title}</span>
      <strong>{value}</strong>
      {sublabel ? <small>{sublabel}</small> : null}
    </article>
  );
}

function DurationCard({
  years,
  months,
  days
}: {
  years: number | null;
  months: number | null;
  days: number | null;
}) {
  return (
    <article className="result-card-block wide">
      <span className="result-card-label">経過期間（年・月・日）</span>
      <div className="duration-row">
        <div>
          <strong>{years === null ? '-' : years.toLocaleString('ja-JP')}</strong>
          <small>年</small>
        </div>
        <div>
          <strong>{months === null ? '-' : months.toLocaleString('ja-JP')}</strong>
          <small>ヶ月</small>
        </div>
        <div>
          <strong>{days === null ? '-' : days.toLocaleString('ja-JP')}</strong>
          <small>日</small>
        </div>
      </div>
    </article>
  );
}

export function EraAgeConverter({ state, onStateChange, onReset }: EraAgeConverterProps) {
  const [flashMessage, setFlashMessage] = useState('');
  const [focusTargetGranularity, setFocusTargetGranularity] = useState<'year' | 'date' | null>(null);
  const targetDateToggleRef = useRef<HTMLButtonElement>(null);
  const targetYearToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!focusTargetGranularity) {
      return;
    }

    if (focusTargetGranularity === 'date') {
      targetDateToggleRef.current?.focus();
    } else {
      targetYearToggleRef.current?.focus();
    }
    setFocusTargetGranularity(null);
  }, [focusTargetGranularity, state.targetDate.granularity]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timer = window.setTimeout(() => setFlashMessage(''), 2400);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const todaySummary = useMemo(() => {
    const today = new Date();
    const parts = toDateParts(today);
    const normalized = normalizeToGregorian(parts);
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
      eraLabel: formatEraYearLabel(parts, normalized.gregorianYear)
    };
  }, []);

  const updateState = (nextState: EraAgeState) => {
    onStateChange({
      ...nextState,
      result: buildResult(nextState)
    });
  };

  const updateDate = (key: 'baseDate' | 'targetDate', nextDate: DateInput) => {
    updateState({
      ...state,
      [key]: nextDate
    });
  };

  const updateInputMode = (key: 'baseInputMode' | 'targetInputMode', mode: InputMode) => {
    const pairedDateKey = key === 'baseInputMode' ? 'baseDate' : 'targetDate';
    const currentDate = state[pairedDateKey];
    const nextDate =
      mode === 'age'
        ? { ...currentDate, granularity: 'year' as const }
        : mode === 'gregorian'
          ? { ...currentDate, era: 'gregorian' as const }
          : { ...currentDate, era: currentDate.era === 'gregorian' ? 'reiwa' : currentDate.era };

    updateState({
      ...state,
      [key]: mode,
      [pairedDateKey]: nextDate
    });
  };

  const updateGranularity = (source: 'baseDate' | 'targetDate', granularity: 'year' | 'date') => {
    const nextBaseDate: DateInput =
      granularity === 'date'
        ? { ...state.baseDate, granularity, month: state.baseDate.month ?? 1, day: state.baseDate.day ?? 1 }
        : { ...state.baseDate, granularity };
    const nextTargetDate: DateInput =
      granularity === 'date'
        ? { ...state.targetDate, granularity, month: state.targetDate.month ?? 1, day: state.targetDate.day ?? 1 }
        : { ...state.targetDate, granularity };

    if (source === 'baseDate') {
      setFocusTargetGranularity(granularity);
    }

    updateState({
      ...state,
      baseDate: nextBaseDate,
      targetDate: nextTargetDate
    });
  };

  const runCalculation = () => {
    updateState(state);
    setFlashMessage('最新の入力で結果を更新しました。');
  };

  const copyResults = async () => {
    const lines = [
      `年号: ${state.result.baseEraLabel ?? '-'}`,
      `西暦: ${state.result.baseGregorianYear ?? '-'}`,
      `経過期間（年）: ${state.result.age ?? '-'}`,
      `十干十二支: ${state.result.zodiac.eto ?? '-'}`,
      `対象年: ${state.result.targetEraLabel ?? '-'}`,
      `経過期間: ${formatNumber(state.result.duration.years)}年 ${formatNumber(state.result.duration.months)}ヶ月 ${formatNumber(state.result.duration.days)}日`,
      `総日数: ${formatNumber(state.result.duration.totalDays, '日')}`
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setFlashMessage('結果をコピーしました。');
    } catch {
      setFlashMessage('コピーに失敗しました。');
    }
  };

  const topMessages = [flashMessage, ...state.result.errors, ...state.result.warnings].filter(Boolean) as string[];

  return (
    <div className="era-page">
      <div className="summary-row">
        <section className="today-card">
          <div className="today-card-label">今日の日付</div>
          <div className="today-card-main">
            <strong>
              {todaySummary.year}年 {todaySummary.month}月 {todaySummary.day}日
            </strong>
            <span>{todaySummary.eraLabel ?? '-'}</span>
          </div>

        </section>

        {topMessages.length > 0 ? (
          <div className="top-message-stack">
            {topMessages.map((message) => (
              <p
                key={message}
                className={
                  state.result.errors.includes(message)
                    ? 'message error'
                    : state.result.warnings.includes(message)
                      ? 'message warning'
                      : 'message success'
                }
              >
                {message}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="bento-grid">
        <section className="panel panel-input">
          <div className="panel-head">
            <h3>入力設定</h3>
            <button type="button" className="ghost-action" onClick={onReset}>
              リセット
            </button>
          </div>

          <InputSection
            title="基準日 / 生年月日"
            value={state.baseDate}
            inputMode={state.baseInputMode}
            helperText="和暦または西暦で入力できます。"
            onChange={(nextDate) => updateDate('baseDate', nextDate)}
            onInputModeChange={(mode) => updateInputMode('baseInputMode', mode)}
            onGranularityChange={(granularity) => updateGranularity('baseDate', granularity)}
          />

          <InputSection
            title="対象日"
            value={state.targetDate}
            inputMode={state.targetInputMode}
            helperText="初期値は今日です。入力粒度は左右で連動します。"
            onChange={(nextDate) => updateDate('targetDate', nextDate)}
            onInputModeChange={(mode) => updateInputMode('targetInputMode', mode)}
            onGranularityChange={(granularity) => updateGranularity('targetDate', granularity)}
            dateToggleRef={targetDateToggleRef}
            yearToggleRef={targetYearToggleRef}
          />

          <div className="input-actions centered">
            <button type="button" className="primary-button fit" onClick={runCalculation}>
              計算を実行
            </button>
          </div>
        </section>

        <section className="panel panel-result">
          <div className="panel-head">
            <h3>計算結果</h3>
            <button type="button" className="ghost-action highlight" onClick={copyResults}>
              結果をコピー
            </button>
          </div>

          <div className="result-grid">
            <ResultCard title="年号" value={state.result.baseEraLabel ?? '-'} />
            <ResultCard title="十干十二支" value={state.result.zodiac.eto ?? '-'} sublabel={state.result.zodiac.ruby ?? undefined} />
            <ResultCard title="西暦" value={formatNumber(state.result.baseGregorianYear, '年')} />
            <ResultCard title="経過期間（年）" value={formatNumber(state.result.age, '年')} />
            <DurationCard
              years={state.result.duration.years}
              months={state.result.duration.months}
              days={state.result.duration.days}
            />
            <ResultCard
              title="経過期間（月・日）"
              value={`${formatNumber(state.result.duration.totalMonths, 'ヶ月')} ${formatNumber(state.result.duration.days, '日')}`}
            />
            <ResultCard title="経過期間（日）" value={formatNumber(state.result.duration.totalDays, '日')} />
          </div>
          <div className="era-period-section">
            <h4>各元号の期間</h4>
            <div className="era-period-list">
              {ERA_PERIOD_LABELS.map((label) => (
                <p key={label} className="era-period-item">
                  {label}
                </p>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
