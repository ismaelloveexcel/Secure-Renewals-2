import type React from 'react';
import { useState } from 'react';

/**
 * HR Portal Home Page
 * Features an elegant 2x2 quadrant menu with glassmorphism effects
 * and improved accessibility for solo HR maintenance.
 */
function App() {
  const [logoLoaded, setLogoLoaded] = useState(true);

  const menuItems = [
    {
      title: 'Employees',
      description: 'People directory, profiles, and org visibility',
      icon: <UsersIcon />,
      position: 'tl' as const,
      href: '?page=employees',
      tooltip: 'View and manage employee records',
    },
    {
      title: 'Onboarding',
      description: 'Guided journeys for new joiners and managers',
      icon: <ClipboardIcon />,
      position: 'tr' as const,
      href: '?page=onboarding',
      tooltip: 'Track new hire onboarding progress',
    },
    {
      title: 'External Users',
      description: 'Secure access for recruiters and contractors',
      icon: <GlobeIcon />,
      position: 'bl' as const,
      href: '?page=external',
      tooltip: 'Manage external recruiters and contractors',
    },
    {
      title: 'Admin',
      description: 'Controls, approvals, and escalation visibility',
      icon: <ShieldIcon />,
      position: 'br' as const,
      href: '?page=admin',
      tooltip: 'Access administrative functions',
    },
  ];

  return (
    <div className="page-shell min-h-screen overflow-hidden">
      <div className="background-aurora" aria-hidden />
      <div className="background-grid" aria-hidden />

      <main className="relative max-w-6xl mx-auto px-6 py-10 lg:py-14 page-transition">
        <header className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-chip text-sm text-indigo-900">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Systems live & secured
          </div>

          <div className="space-y-2">
            {logoLoaded ? (
              <img
                src="/attached_assets/logo_1765648544636_1766742634201.png"
                alt="Baynunah"
                className="h-14 mx-auto"
                onError={() => setLogoLoaded(false)}
              />
            ) : (
              <h1 className="text-3xl font-semibold text-gray-900 tracking-wider">baynunah</h1>
            )}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">HR Experience Hub</h2>
              <p className="text-gray-600 mt-2 max-w-2xl mx-auto leading-relaxed">
                Navigate core HR journeys with a crisp, glassmorphic palette designed for clarity and focus.
                Each tile is keyboard-friendly and provides instant context before you click through.
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 items-start">
          <div className="glass-panel p-6 rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 uppercase tracking-[0.2em]">Orientation</p>
                <h3 className="text-xl font-semibold text-gray-900 mt-1">Your daily HR console</h3>
              </div>
              <div className="pill-accent">V3 Visual Refresh</div>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Quick-launch the spaces you need most, with hover states that hint at movement and reliable focus rings for
              accessibility. The layout breathes with soft gradients and improved contrast.
            </p>
            <div className="flex flex-col gap-2 text-sm text-gray-700">
              <div className="hint-tile">Use <kbd>Tab</kbd> + <kbd>Enter</kbd> to jump between quadrants.</div>
              <div className="hint-tile">Hover to preview intent and accent colors before committing.</div>
              <div className="hint-tile">All links open within the secure HR perimeter.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center">
            {menuItems.map((item) => (
              <MenuButton key={item.title} {...item} />
            ))}
          </div>
        </section>

        <footer className="mt-12 text-center text-sm text-gray-500 tracking-wider">
          Conceptualised by Baynunah | HR | IS
        </footer>
      </main>
    </div>
  );
}

interface MenuButtonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  position: 'tl' | 'tr' | 'bl' | 'br';
  href: string;
  tooltip?: string;
}

function MenuButton({ title, description, icon, position, href, tooltip }: MenuButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const radiusStyles = {
    tl: '160px 8px 8px 8px',
    tr: '8px 160px 8px 8px',
    bl: '8px 8px 8px 160px',
    br: '8px 8px 160px 8px',
  }[position];

  const baseStyle: React.CSSProperties = {
    borderRadius: radiusStyles,
    textDecoration: 'none',
  };

  return (
    <a
      href={href}
      className={`menu-card flex flex-col justify-between cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500`}
      style={baseStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={tooltip}
      aria-label={`Navigate to ${title}`}
    >
      <div className="menu-card__top">
        <div className="icon-ring" aria-hidden>
          <span className={`icon-ring__glow ${isHovered ? 'icon-ring__glow--active' : ''}`} />
          <div className="icon-ring__inner" style={{ color: isHovered ? '#fff' : '#0f172a' }}>
            {icon}
          </div>
        </div>
        <span className="menu-card__badge">{position.toUpperCase()} access</span>
      </div>
      <div className="space-y-1">
        <span className="menu-card__title">{title}</span>
        <p className="menu-card__description">{description}</p>
      </div>
      <div className="menu-card__cta">
        <span>Open</span>
        <span className="menu-card__chevron" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </span>
      </div>
      <div className={`menu-card__accent menu-card__accent--${position} ${isHovered ? 'menu-card__accent--active' : ''}`} aria-hidden />
    </a>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <path d="M9 12h6"/>
      <path d="M9 16h6"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  );
}

export default App;
