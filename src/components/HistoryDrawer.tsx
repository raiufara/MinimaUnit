import { useEffect, useMemo, useState } from 'react';
import type { HistoryEntry } from '../lib/history';
import type { ToolId } from '../types';

interface HistoryDrawerProps {
  open: boolean;
  activeToolId: ToolId;
  activeToolLabel: string;
  entries: HistoryEntry[];
  onClose: () => void;
  onRestore: (entry: HistoryEntry) => void;
  onDelete: (entryId: string) => void;
  onClear: (toolId?: ToolId) => void;
}

type HistoryFilter = 'current' | 'all';

function formatSavedAt(value: string): string {
  try {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function HistoryDrawer({
  open,
  activeToolId,
  activeToolLabel,
  entries,
  onClose,
  onRestore,
  onDelete,
  onClear
}: HistoryDrawerProps) {
  const [filter, setFilter] = useState<HistoryFilter>('current');

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setFilter('current');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  const visibleEntries = useMemo(() => {
    if (filter === 'all') {
      return entries;
    }

    return entries.filter((entry) => entry.toolId === activeToolId);
  }, [activeToolId, entries, filter]);

  if (!open) {
    return null;
  }

  return (
    <div className="history-overlay" role="presentation" onClick={onClose}>
      <aside
        className="history-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="履歴"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="history-drawer-head">
          <div className="history-drawer-title">
            <p className="top-label">Saved States</p>
            <h3>履歴</h3>
          </div>
          <button type="button" className="header-icon-button history-close-button" aria-label="履歴を閉じる" onClick={onClose}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="history-filter-row" role="tablist" aria-label="履歴の表示範囲">
          <button
            type="button"
            className={filter === 'current' ? 'history-filter-button active' : 'history-filter-button'}
            onClick={() => setFilter('current')}
          >
            このツール
          </button>
          <button
            type="button"
            className={filter === 'all' ? 'history-filter-button active' : 'history-filter-button'}
            onClick={() => setFilter('all')}
          >
            すべて
          </button>
        </div>

        <div className="history-filter-caption">
          {filter === 'current' ? `${activeToolLabel}の履歴を表示しています。` : '保存済みの履歴を新しい順に表示しています。'}
        </div>

        <div className="history-toolbar">
          <button
            type="button"
            className="history-clear-button"
            disabled={visibleEntries.length === 0}
            onClick={() => onClear(filter === 'current' ? activeToolId : undefined)}
          >
            {filter === 'current' ? 'このツールを消去' : 'すべて消去'}
          </button>
        </div>

        {visibleEntries.length === 0 ? (
          <div className="history-empty">
            <strong>まだ履歴がありません。</strong>
            <p>入力を変えてしばらくすると、この端末に履歴を保存します。</p>
          </div>
        ) : (
          <div className="history-list">
            {visibleEntries.map((entry) => (
              <article key={entry.id} className="history-item">
                <div className="history-item-head">
                  <span className="history-item-tool">{entry.toolLabel}</span>
                  <time dateTime={entry.savedAt}>{formatSavedAt(entry.savedAt)}</time>
                </div>
                <h4>{entry.title}</h4>
                <p>{entry.summary}</p>
                <div className="history-item-actions">
                  <button type="button" className="history-action-button primary" onClick={() => onRestore(entry)}>
                    復元
                  </button>
                  <button type="button" className="history-action-button" onClick={() => onDelete(entry.id)}>
                    削除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
