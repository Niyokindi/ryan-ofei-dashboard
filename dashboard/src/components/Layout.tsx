import { useState, type ReactNode } from 'react';

const TABS = ['Streaming', 'Social Media', 'Insights'] as const;
export type Tab = (typeof TABS)[number];

const TAB_ICONS: Record<Tab, string> = {
  Streaming: '▶',
  'Social Media': '◉',
  Insights: '✦',
};

const SIDEBAR_OPEN_WIDTH = 220;
const SIDEBAR_CLOSED_WIDTH = 64;

interface LayoutProps {
  children: (activeTab: Tab) => ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Streaming');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sidebarWidth = sidebarOpen ? SIDEBAR_OPEN_WIDTH : SIDEBAR_CLOSED_WIDTH;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#000' }}>
      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarWidth,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(20px)',
          transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.1)',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            R
          </div>
          <div
            style={{
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              opacity: sidebarOpen ? 1 : 0,
              transition: 'opacity 200ms',
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Ryan Ofei</p>
            <p style={{ fontSize: 10, color: '#71717a' }}>Performance Dashboard</p>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                title={tab}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? '#fff' : '#71717a',
                  transition: 'background 150ms, color 150ms',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.color = '#d4d4d8';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#71717a';
                  }
                }}
              >
                <span style={{ flexShrink: 0, fontSize: 12 }}>{TAB_ICONS[tab]}</span>
                <span
                  style={{
                    overflow: 'hidden',
                    opacity: sidebarOpen ? 1 : 0,
                    transition: 'opacity 200ms',
                  }}
                >
                  {tab}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 8px' }}>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: 12,
              width: '100%',
              padding: '8px 12px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              color: '#71717a',
              background: 'transparent',
              transition: 'background 150ms, color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#d4d4d8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#71717a';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                flexShrink: 0,
                transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 300ms',
              }}
            >
              <path
                d="M10 12L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                opacity: sidebarOpen ? 1 : 0,
                transition: 'opacity 200ms',
              }}
            >
              Collapse
            </span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          minHeight: '100vh',
          marginLeft: sidebarWidth,
          transition: 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="px-6 py-8 lg:px-10">
          {children(activeTab)}
        </div>
      </main>
    </div>
  );
}
