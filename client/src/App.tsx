import { useState } from 'react';

/**
 * HR Portal Home Page
 * Features an elegant 2x2 quadrant menu with glassmorphism effects
 * and improved accessibility for solo HR maintenance.
 */
function App() {
  const [logoLoaded, setLogoLoaded] = useState(true);

  return (
    <div className="dotted-grid min-h-screen flex flex-col items-center justify-center p-5 page-transition">
      <div className="text-center mb-8">
        <img 
          src="/attached_assets/logo_1765648544636_1766742634201.png" 
          alt="Baynunah" 
          className="h-16 mx-auto mb-4"
          onError={() => setLogoLoaded(false)}
          style={{ display: logoLoaded ? 'block' : 'none' }}
        />
        {!logoLoaded && (
          <h1 className="text-3xl font-semibold text-gray-800 tracking-wider">baynunah</h1>
        )}
        <h2 className="text-xl font-medium text-gray-700 tracking-widest uppercase mt-2">HR Portal</h2>
      </div>

      <div className="grid grid-cols-2 gap-1 max-w-xs">
        <MenuButton 
          title="Employees" 
          icon={<UsersIcon />} 
          position="tl"
          href="?page=employees"
          tooltip="View and manage employee records"
        />
        <MenuButton 
          title="Onboarding" 
          icon={<ClipboardIcon />} 
          position="tr"
          href="?page=onboarding"
          tooltip="Track new hire onboarding progress"
        />
        <MenuButton 
          title="External Users" 
          icon={<GlobeIcon />} 
          position="bl"
          href="?page=external"
          tooltip="Manage external recruiters and contractors"
        />
        <MenuButton 
          title="Admin" 
          icon={<ShieldIcon />} 
          position="br"
          href="?page=admin"
          tooltip="Access administrative functions"
        />
      </div>

      <footer className="mt-12 text-sm text-gray-500 tracking-wider">
        Conceptualised by Baynunah|HR|IS
      </footer>
      
      {/* Quick access hint */}
      <div className="fixed bottom-4 right-4 text-xs text-gray-400">
        Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-600">?</kbd> for help
      </div>
    </div>
  );
}

interface MenuButtonProps {
  title: string;
  icon: React.ReactNode;
  position: 'tl' | 'tr' | 'bl' | 'br';
  href: string;
  tooltip?: string;
}

function MenuButton({ title, icon, position, href, tooltip }: MenuButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const radiusStyles = {
    tl: '160px 8px 8px 8px',
    tr: '8px 160px 8px 8px',
    bl: '8px 8px 8px 160px',
    br: '8px 8px 160px 8px',
  }[position];

  const contentPosition = 'items-center justify-center';

  const baseStyle: React.CSSProperties = {
    width: '160px',
    height: '160px',
    borderRadius: radiusStyles,
    background: isHovered ? '#171717' : '#e8e8e8',
    color: isHovered ? 'white' : '#374151',
    transform: isHovered ? 'translateY(-0.8em)' : 'translateY(0)',
    letterSpacing: isHovered ? '0.5em' : '0.2em',
    transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
    boxShadow: isHovered 
      ? '0 12px 32px rgba(0,0,0,0.25), 0 6px 16px rgba(0,0,0,0.15)'
      : 'inset 2px 5px 10px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(255,255,255,0.3), 5px 5px 15px rgba(0,0,0,0.1), -5px -5px 15px rgba(255,255,255,0.8)',
    textDecoration: 'none',
  };

  return (
    <a
      href={href}
      className={`flex flex-col ${contentPosition} cursor-pointer text-xs font-medium uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500`}
      style={baseStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={tooltip}
      aria-label={`Navigate to ${title}`}
    >
      <div className="mb-2" style={{ color: isHovered ? 'white' : '#39FF14' }}>
        {icon}
      </div>
      <span className="text-center">{title}</span>
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
