import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLiveState } from '../hooks/useLiveState'
import { ToastHost } from './ToastHost'

export function AppShell() {
  const { connection } = useLiveState()
  const location = useLocation()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  useEffect(() => { setQ('') }, [location.pathname])

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/players${q ? `?q=${encodeURIComponent(q)}` : ''}`)
  }

  const titleMap: Record<string, string> = {
    '/': 'Dashboard',
    '/players': 'Players',
    '/alerts': 'Alerts',
  }
  const title =
    Object.entries(titleMap).find(([k]) => location.pathname === k || (k !== '/' && location.pathname.startsWith(k)))?.[1] ??
    'Overview'

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-name">MineGuard</div>
            <div className="brand-sub">anti-grief sentinel</div>
          </div>
        </div>

        <nav className="nav">
          <NavItem to="/" end label="Dashboard" icon={<GridIcon />} />
          <NavItem to="/players" label="Players" icon={<UsersIcon />} />
          <NavItem to="/alerts"  label="Alerts"  icon={<BellIcon />} />
        </nav>

        <div className="sidebar-footer">
          <div className={`conn ${connection}`}>
            <span className="conn-dot" />
            <span className="conn-label">
              {connection === 'online' ? 'live · connected' : connection === 'offline' ? 'reconnecting…' : 'connecting…'}
            </span>
          </div>
          <div className="version">v0.1 · dev</div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-actions">
            <form className="search" onSubmit={onSearchSubmit}>
              <span className="search-icon">⌕</span>
              <input
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search players…"
                autoComplete="off"
              />
            </form>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>

      <ToastHost />
    </div>
  )
}

function NavItem({ to, label, icon, end }: { to: string; label: string; icon: React.ReactNode; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

const baseProps = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
function GridIcon()  { return <svg {...baseProps}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
function UsersIcon() { return <svg {...baseProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function BellIcon()  { return <svg {...baseProps}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> }
