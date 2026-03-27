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

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        className="gear-mark"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.926 2.25a1.875 1.875 0 0 0-1.85 1.567l-.178 1.072a6.83 6.83 0 0 0-1.337.774l-1.021-.382a1.875 1.875 0 0 0-2.282.818L3.336 7.7a1.875 1.875 0 0 0 .432 2.386l.842.692a6.84 6.84 0 0 0 0 1.544l-.842.692a1.875 1.875 0 0 0-.432 2.386l.922 1.598a1.875 1.875 0 0 0 2.282.818l1.021-.382c.416.313.864.572 1.337.774l.178 1.072a1.875 1.875 0 0 0 1.85 1.567h2.148a1.875 1.875 0 0 0 1.85-1.567l.178-1.072c.473-.202.92-.46 1.337-.774l1.021.382a1.875 1.875 0 0 0 2.282-.818l.922-1.598a1.875 1.875 0 0 0-.432-2.386l-.842-.692a6.84 6.84 0 0 0 0-1.544l.842-.692a1.875 1.875 0 0 0 .432-2.386l-.922-1.598a1.875 1.875 0 0 0-2.282-.818l-1.021.382a6.83 6.83 0 0 0-1.337-.774l-.178-1.072a1.875 1.875 0 0 0-1.85-1.567h-2.148ZM12 15.75A3.75 3.75 0 1 0 12 8.25a3.75 3.75 0 0 0 0 7.5Z"
      />
    </svg>
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
            <img src="/logo-full.svg" alt="MinimaUnit - Smart Converter" className="brand-logo brand-logo-light" />
            <img src="/logo-full-dark.svg" alt="MinimaUnit - Smart Converter" className="brand-logo brand-logo-dark" />
          </h1>
        </div>

        <div className="header-actions">
          <button type="button" className="header-icon-button" aria-label="設定" onClick={onOpenSettings}>
            <SettingsIcon />
          </button>
          <div className={isOffline ? 'status-pill offline' : 'status-pill online'} aria-label={isOffline ? 'オフライン利用可' : 'オンライン'}>
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
