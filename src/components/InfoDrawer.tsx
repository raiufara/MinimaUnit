import type { InfoSectionId } from '../types';

interface InfoSection {
  id: InfoSectionId;
  label: string;
  title: string;
  intro: string;
  bullets?: string[];
  notes?: string[];
  links?: Array<{
    label: string;
    href: string;
  }>;
}

const INFO_SECTIONS: readonly InfoSection[] = [
  {
    id: 'privacy',
    label: 'プライバシー',
    title: 'プライバシーポリシー',
    intro:
      '本アプリは、できる限り端末内で完結する構成を採用しています。氏名やメールアドレスなどの個人情報を、アプリ入力欄として常時収集する設計にはしていません。',
    bullets: [
      '履歴、設定、通貨の保存済み参考レートは、この端末のブラウザ内に保存されます。',
      '年齢・期間の生年月日や各種入力値は、ユーザーが保存機能を使わない限り外部へ送信しません。',
      '通貨のレート更新を行った場合のみ、参考レート取得のために外部公開データへ接続します。'
    ],
    notes: [
      '共有端末では、必要に応じて履歴の削除や設定の初期化を行ってください。',
      '今後、問い合わせ導線や解析機能を追加する場合は、この案内も更新します。'
    ]
  },
  {
    id: 'terms',
    label: '利用規約',
    title: '利用規約',
    intro:
      '本アプリは、日常業務や学習の補助を目的とした参考ツールです。表示結果の正確性には配慮していますが、最終判断や提出書類の確認は利用者の責任で行ってください。',
    bullets: [
      '法令、税務、登記、医療、金融などの重要判断は、公的資料や専門家の確認を優先してください。',
      '年齢・期間、和暦変換、単位変換、通貨換算の結果は、入力内容や制度変更、丸め表示の影響を受ける場合があります。',
      '本アプリの利用により生じた損害について、運営者は直接・間接を問わず責任を負いません。'
    ],
    notes: ['画面上の説明文や注意書きも、利用規約の一部としてあわせて確認してください。']
  },
  {
    id: 'contact',
    label: 'お問い合わせ',
    title: 'お問い合わせ',
    intro:
      '改善要望や不具合報告は、公開中の GitHub リポジトリから受け付けています。再現条件や利用環境が分かる情報を添えて共有いただけると確認がスムーズです。',
    bullets: [
      '不具合報告では、利用機能、入力内容、発生した画面、端末情報が分かると確認しやすくなります。',
      '通貨レートや制度変更に関する指摘は、基準日や参照元とあわせて共有されると対応が早くなります。'
    ],
    notes: [
      '現時点では、アプリ内フォームや専用メール窓口は設けていません。必要に応じて今後追加します。',
      '公開サイトのURLは https://unit.minimaapps.dev/ です。'
    ],
    links: [
      {
        label: '公開サイトを開く',
        href: 'https://unit.minimaapps.dev/'
      },
      {
        label: 'GitHub Issues を開く',
        href: 'https://github.com/raiufara/MinimaUnit/issues'
      }
    ]
  },
  {
    id: 'currency',
    label: '参考レート',
    title: '通貨レートについて',
    intro:
      '通貨機能はリアルタイム売買レートではなく、公開されている参考レートをもとにした比較用ツールです。実際の両替、送金、決済レートとは一致しない場合があります。',
    bullets: [
      'レート更新は手動です。基準日と最終更新時刻を確認して利用してください。',
      'TWD は公開データの都合上、ECB と台湾中銀の値を組み合わせた参考値を使う場合があります。',
      '市場休場日や祝日には、基準日が当日にならないことがあります。'
    ],
    notes: [
      '業務や契約で使用する場合は、金融機関や公的機関の最新情報を必ず確認してください。',
      '画面の換算結果は見やすさのために丸め表示を含みます。'
    ]
  }
];

interface InfoDrawerProps {
  open: boolean;
  activeSection: InfoSectionId;
  onClose: () => void;
  onSectionChange: (section: InfoSectionId) => void;
}

export function InfoDrawer({ open, activeSection, onClose, onSectionChange }: InfoDrawerProps) {
  if (!open) {
    return null;
  }

  const currentSection = INFO_SECTIONS.find((section) => section.id === activeSection) ?? INFO_SECTIONS[0];

  return (
    <div className="info-overlay" onClick={onClose} role="presentation">
      <aside
        className="info-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="info-drawer-head">
          <div className="info-drawer-title">
            <p className="top-label">案内</p>
            <h3 id="info-drawer-title">{currentSection.title}</h3>
          </div>
          <button type="button" className="history-close-button" aria-label="案内を閉じる" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="info-tab-row" role="tablist" aria-label="案内セクション">
          {INFO_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={section.id === currentSection.id}
              className={section.id === currentSection.id ? 'info-tab-button active' : 'info-tab-button'}
              onClick={() => onSectionChange(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="info-drawer-body">
          <section className="info-card">
            <p className="info-intro">{currentSection.intro}</p>

            {currentSection.bullets ? (
              <ul className="info-list">
                {currentSection.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}

            {currentSection.notes ? (
              <div className="info-note-stack">
                {currentSection.notes.map((note) => (
                  <p key={note} className="info-note">
                    {note}
                  </p>
                ))}
              </div>
            ) : null}

            {currentSection.links ? (
              <div className="info-link-row">
                {currentSection.links.map((link) => (
                  <a
                    key={link.href}
                    className="info-link-button"
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </aside>
    </div>
  );
}
