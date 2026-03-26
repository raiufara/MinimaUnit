import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { ToolId } from '../types';

interface ToolItem {
  id: ToolId;
  label: string;
  path: string;
  enabled: boolean;
}

interface LayoutProps {
  activeToolId: ToolId;
  activeToolLabel: string;
  toolDescription?: string;
  isOffline: boolean;
  tools: readonly ToolItem[];
  onToolChange: (toolId: ToolId) => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenContact: () => void;
  onOpenCurrencyInfo: () => void;
  historyDrawer?: ReactNode;
  settingsDrawer?: ReactNode;
  infoDrawer?: ReactNode;
  children: ReactNode;
}

function ToolIcon({ toolId }: { toolId: ToolId }) {
  switch (toolId) {
    case 'era-age':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M8 4v4M16 4v4M4 10h16" />
        </svg>
      );
    case 'length':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8h16M6 8v8M10 8v5M14 8v8M18 8v5" />
        </svg>
      );
    case 'weight':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 7a4 4 0 0 1 8 0M5 19h14l-2-8H7l-2 8Z" />
        </svg>
      );
    case 'area':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 18 18 6M6 12l6-6M12 18l6-6" />
        </svg>
      );
    case 'volume':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 8h8v8H8zM5 11l7-4 7 4-7 4-7-4Z" />
        </svg>
      );
    case 'temperature':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 5a2 2 0 1 1 4 0v7.2a4 4 0 1 1-4 0Z" />
          <path d="M14 9h4M14 13h3" />
        </svg>
      );
    case 'speed':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 16a6 6 0 1 1 12 0" />
          <path d="M12 16l4-4" />
        </svg>
      );
    case 'currency':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="7" width="16" height="10" rx="2" />
          <path d="M9 12h6M12 10v4" />
        </svg>
      );
    default:
      return null;
  }
}

function ToolChip({
  tool,
  active,
  onActivate
}: {
  tool: ToolItem;
  active: boolean;
  onActivate: () => void;
}) {
  if (!tool.enabled) {
    return (
      <span className="tool-chip disabled" aria-disabled="true">
        <span className="tool-chip-glyph" aria-hidden="true">
          <ToolIcon toolId={tool.id} />
        </span>
        <span className="tool-chip-label">{tool.label}</span>
      </span>
    );
  }

  return (
    <Link to={tool.path} className={active ? 'tool-chip active' : 'tool-chip'} onClick={onActivate}>
      <span className="tool-chip-glyph" aria-hidden="true">
        <ToolIcon toolId={tool.id} />
      </span>
      <span className="tool-chip-label">{tool.label}</span>
    </Link>
  );
}

export function Layout({
  activeToolId,
  activeToolLabel,
  toolDescription,
  isOffline,
  tools,
  onToolChange,
  onOpenHistory,
  onOpenSettings,
  onOpenPrivacy,
  onOpenTerms,
  onOpenContact,
  onOpenCurrencyInfo,
  historyDrawer,
  settingsDrawer,
  infoDrawer,
  children
}: LayoutProps) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="shell-header">
        <div className="brand-group">
          <p className="brand-caption">Smart Converter Suite</p>
          <h1 className="brand-heading">
            <img src="/logo-full.svg" alt="MinimaUnit - Smart Converter" className="brand-logo" />
          </h1>
        </div>

        <div className="header-actions">
          <button type="button" className="header-icon-button" aria-label="オフライン状態">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.75 8.8a11.8 11.8 0 0 1 14.5 0" />
              <path d="M7.5 11.8a7.9 7.9 0 0 1 9 0" />
              <path d="M10.3 14.85a4.05 4.05 0 0 1 3.4 0" />
              <path d="M3.6 4 20.4 20" />
            </svg>
          </button>
          <button type="button" className="header-icon-button" aria-label="設定" onClick={onOpenSettings}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58-1.92-3.32-2.39.96a7.33 7.33 0 0 0-1.63-.95L14.87 3h-3.74l-.36 2.17c-.58.23-1.13.55-1.63.94l-2.39-.96-1.92 3.32 2.03 1.58c-.04.31-.06.63-.06.95s.02.64.06.95l-2.03 1.58 1.92 3.32 2.39-.96c.5.39 1.05.7 1.63.93l.36 2.18h3.74l.36-2.18c.58-.23 1.13-.54 1.63-.93l2.39.96 1.92-3.32-2.03-1.58Z" />
              <circle cx="12" cy="12" r="3.2" />
            </svg>
          </button>
          <div className={isOffline ? 'status-pill offline' : 'status-pill online'}>
            <span className="status-dot" />
            {isOffline ? 'オフライン利用可' : 'オンライン'}
          </div>
        </div>
      </header>

      <nav className="tool-strip" aria-label="ツール一覧">
        {tools.map((tool) => (
          <ToolChip
            key={tool.id}
            tool={tool}
            active={location.pathname === tool.path || activeToolId === tool.id}
            onActivate={() => onToolChange(tool.id)}
          />
        ))}
      </nav>

      <section className="page-heading">
        <div className="page-heading-title">
          <p className="top-label">現在のツール</p>
          <h2>{activeToolLabel}</h2>
        </div>
        {toolDescription ? <p className="page-heading-description">{toolDescription}</p> : null}
        <button type="button" className="history-button" onClick={onOpenHistory}>
          履歴を表示
        </button>
      </section>

      <main className="content-panel">{children}</main>

      <footer className="shell-footer">
        <span className="footer-brand">MinimaUnit - Smart Converter</span>
        <div className="footer-links">
          <button type="button" className="footer-link-button" onClick={onOpenPrivacy}>
            プライバシーポリシー
          </button>
          <button type="button" className="footer-link-button" onClick={onOpenTerms}>
            利用規約
          </button>
          <button type="button" className="footer-link-button" onClick={onOpenCurrencyInfo}>
            参考レート
          </button>
          <button type="button" className="footer-link-button" onClick={onOpenContact}>
            お問い合わせ
          </button>
        </div>
        <span className="footer-meta">© 2026 FTF Engineers All rights reserved.</span>
      </footer>

      {historyDrawer}
      {settingsDrawer}
      {infoDrawer}
    </div>
  );
}
