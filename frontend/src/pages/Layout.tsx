import { ReactNode } from 'react'
import { Page, Toast } from '../App'

/* ── ICONS ─────────────────────────────────────────────── */
const Ico = ({ n, s = 16 }: { n: string; s?: number }) => {
  const P: Record<string, JSX.Element> = {
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    truck: <><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
    building: <><rect x="3" y="9" width="18" height="13" /><path d="M8 22V12h8v10M3 9V6l9-3 9 3v3" /><path d="M10 22V17h4v5" /></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
    server: <><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    check: <><polyline points="20 6 9 17 4 12" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {P[n]}
    </svg>
  )
}

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'vehicles', label: 'Veículos', icon: 'truck' },
  { id: 'models', label: 'Modelos', icon: 'tag' },
  { id: 'brands', label: 'Marcas', icon: 'building' },
  { id: 'users', label: 'Usuários', icon: 'users' },
]

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  vehicles: 'Veículos',
  models: 'Modelos',
  brands: 'Marcas',
  users: 'Usuários',
  api: 'Endpoints API',
}

interface Props {
  page: Page
  setPage: (p: Page) => void
  onLogout: () => void
  toasts: Toast[]
  children: ReactNode
}

export default function Layout({ page, setPage, onLogout, toasts, children }: Props) {
  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sb-logo">
          <div className="sb-badge">A</div>
          <div>
            <div className="sb-name">Aivacol<small>Gestão de Frota</small></div>
          </div>
        </div>
        <div className="sb-nav">
          <div className="sb-section">Menu</div>
          {NAV.map(n => (
            <div key={n.id} className={`sb-item${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
              <Ico n={n.icon} s={15} />{n.label}
            </div>
          ))}
          <div className="sb-section" style={{ marginTop: 12 }}>Sistema</div>
          <div className={`sb-item${page === 'api' ? ' active' : ''}`} onClick={() => setPage('api')}>
            <Ico n="server" s={15} />Endpoints API
          </div>
        </div>
        <div className="sb-foot">
          <div className="sb-user">
            <div className="sb-avatar">A</div>
            <div>
              <div className="sb-uname">aivacol</div>
              <div className="sb-urole">Administrador</div>
            </div>
          </div>
          <div className="sb-logout" onClick={onLogout}><Ico n="logout" s={14} />Sair</div>
        </div>
      </div>

      {/* Main */}
      <div className="main">
        <div className="topbar">
          <div>
            <div className="tb-title">{PAGE_TITLES[page] || '—'}</div>
            <div className="breadcrumb">Aivacol › <b>{PAGE_TITLES[page]}</b></div>
          </div>
          <div className="tb-right">
            <span className="tb-tag">v1.0.0</span>
            <button className="tb-bell"><Ico n="bell" s={15} /></button>
          </div>
        </div>
        <div className="content">{children}</div>
      </div>

      {/* Toasts */}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <Ico n={t.type === 'ok' ? 'check' : t.type === 'er' ? 'x' : 'bell'} s={14} />
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
