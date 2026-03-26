import { useMemo } from 'react';

interface SummaryMessage {
  tone: 'success' | 'info' | 'warning' | 'error';
  text: string;
}

interface ToolSummaryRowProps {
  badge: string;
  messages: SummaryMessage[];
}

export function ToolSummaryRow({ badge, messages }: ToolSummaryRowProps) {
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
    []
  );

  return (
    <div className="summary-row converter-summary-row">
      <section className="today-card">
        <span className="today-card-label">今日の日付</span>
        <div className="today-card-main">
          <strong>{todayLabel}</strong>
          <span>{badge}</span>
        </div>
      </section>

      {messages.length > 0 ? (
        <div className="top-message-stack">
          {messages.map((message) => (
            <p key={`${message.tone}-${message.text}`} className={`message ${message.tone}`}>
              {message.text}
            </p>
          ))}
        </div>
      ) : (
        <div className="length-message-spacer" aria-hidden="true" />
      )}
    </div>
  );
}
