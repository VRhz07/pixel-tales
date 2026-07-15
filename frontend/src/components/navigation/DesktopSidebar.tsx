import { Link, useLocation } from 'react-router-dom';
import { useI18nStore } from '../../stores/i18nStore';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import Logo from '../common/Logo';

const NAV_ITEMS = [
  {
    path: '/home',
    icon: 'home',
    labelKey: 'nav.home',
    color: '#8b5cf6',
  },
  {
    path: '/games',
    icon: 'games',
    labelKey: 'nav.games',
    color: '#ec4899',
  },
  {
    path: '/library',
    icon: 'library',
    labelKey: 'nav.library',
    color: '#3b82f6',
  },
  {
    path: '/social',
    icon: 'social',
    labelKey: 'nav.social',
    color: '#f97316',
  },
  {
    path: '/profile',
    icon: 'profile',
    labelKey: 'nav.profile',
    color: '#22c55e',
  },
];

function NavIcon({ name, color }: { name: string; color: string }) {
  const props = { width: 22, height: 22, fill: color };
  switch (name) {
    case 'home':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
        </svg>
      );
    case 'games':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.55 0 2.74-1.37 2.52-2.91zM11 11H9v2H8v-2H6v-1h2V8h1v2h2v1zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
        </svg>
      );
    case 'library':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
        </svg>
      );
    case 'social':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
    default:
      return null;
  }
}

const DesktopSidebar = () => {
  const location = useLocation();
  const { t } = useI18nStore();
  const { playSound } = useSoundEffects();

  return (
    <aside className="pt-sidebar">
      {/* ── Brand ───────────────────────────────── */}
      <div className="pt-sidebar-brand">
        <div className="pt-sidebar-logo-wrap">
          <Logo width="38px" height="38px" style={{ display: 'block' }} />
        </div>
        <div className="pt-sidebar-brand-text">
          <span className="pt-sidebar-brand-name">pixeltales</span>
          <span className="pt-sidebar-brand-tagline">Magical stories, made by you</span>
        </div>
      </div>

      {/* ── Nav items ───────────────────────────── */}
      <nav className="pt-sidebar-nav" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => playSound('tab-switch')}
              className={`pt-sidebar-item${isActive ? ' pt-sidebar-item--active' : ''}`}
              style={{ '--item-color': item.color } as React.CSSProperties}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="pt-sidebar-item-icon">
                <NavIcon
                  name={item.icon}
                  color={isActive ? '#ffffff' : item.color}
                />
              </span>
              <span className="pt-sidebar-item-label">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer streak card ───────────────────── */}
      <div className="pt-sidebar-footer">
        <div className="pt-sidebar-streak-card">
          <div className="pt-sidebar-streak-row">
            <span className="pt-sidebar-streak-emoji">✨</span>
            <div>
              <p className="pt-sidebar-streak-title">Daily streak</p>
              <p className="pt-sidebar-streak-desc">Keep creating stories!</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
