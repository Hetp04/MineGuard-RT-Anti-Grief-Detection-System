import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { api } from '../lib/api'
import { useLiveState } from '../hooks/useLiveState'
import { fmtTime, isDangerous, scoreStatus } from '../lib/format'
import { StatCard } from '../components/StatCard'
import { Pill } from '../components/Pill'

export function Dashboard() {
  const { data: bootstrap, isLoading } = useQuery({ queryKey: ['bootstrap'], queryFn: api.bootstrap })
  const live = useLiveState()

  useEffect(() => {
    if (bootstrap) {
      live.hydrate({
        stats: bootstrap.stats,
        players: bootstrap.players,
        events: bootstrap.recent_events,
        alerts: bootstrap.open_alerts,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrap])

  const stats   = live.stats   ?? bootstrap?.stats
  const players = live.players.length ? live.players : (bootstrap?.players ?? [])
  const events  = live.events.length  ? live.events  : (bootstrap?.recent_events ?? [])
  const alerts  = live.alerts.length  ? live.alerts  : (bootstrap?.open_alerts ?? [])

  const timelineData = useMemo(() => {
    if (!stats) return []
    return stats.events_per_minute.labels.map((t, i) => ({ t, v: stats.events_per_minute.data[i] }))
  }, [stats])

  const distData = useMemo(() => {
    if (!stats) return []
    const colors = ['#22c55e', '#eab308', '#fb923c', '#ef4444']
    return stats.risk_distribution.labels.map((label, i) => ({
      label, value: stats.risk_distribution.data[i], fill: colors[i],
    }))
  }, [stats])

  if (isLoading || !stats) return <DashboardSkeleton />

  return (
    <>
      <section className="cards">
        <StatCard label="Active players · 5m" value={stats.active_players} sub="last seen within 5 minutes" />
        <StatCard label="Watching"            value={stats.watching}       sub="flagged but not yet critical" />
        <StatCard label="Open alerts"         value={stats.open_alerts}    sub="awaiting review" valueClass={scoreStatus(stats.highest_score)} />
        <StatCard label="Highest risk"        value={stats.highest_score}  sub="live · 0–100 scale"            valueClass={scoreStatus(stats.highest_score)} />
      </section>

      <section className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Events per minute · last 15m</h2>
            <span className="muted tiny">live</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <AreaChart data={timelineData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="t" stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#3a3a3a' }} />
                <Area type="monotone" dataKey="v" stroke="#ececec" fill="rgba(236,236,236,0.10)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h2>Risk distribution</h2></div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={distData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Top players by risk</h2>
            <Link to="/players" className="btn ghost">All players →</Link>
          </div>
          {players.length ? (
            <table className="data">
              <thead><tr><th>Player</th><th>Risk</th><th>Status</th><th>Last action</th><th></th></tr></thead>
              <tbody>
                {players.slice(0, 8).map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="strong">{p.name}</span>
                      <div className="muted tiny mono">{p.uuid}</div>
                    </td>
                    <td className={`num score ${p.status}`}>{p.risk_score}</td>
                    <td><Pill value={p.status} /></td>
                    <td>
                      <span className="muted">{p.last_action?.replace(/_/g, ' ')}</span>{' '}
                      <span className="mono tiny dim">{p.last_block}</span>
                    </td>
                    <td><Link to={`/players/${p.id}`} className="btn ghost">View →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">No players yet. Run <code className="mono">bin/rails mineguard:demo_grief</code> to seed activity.</div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Live activity feed</h2>
            <span className="muted tiny">last {events.length}</span>
          </div>
          {events.length ? (
            <ul className="feed">
              {events.map(e => (
                <li key={e.id} className={isDangerous(e.action_type, e.block_type) ? 'danger' : ''}>
                  <span className="ts">{fmtTime(e.occurred_at)}</span>
                  <span className="who">{e.player_name ?? `#${e.player_id}`}</span>
                  <span className="what">{e.action_type.replace(/_/g, ' ')}</span>
                  <span className="block">{e.block_type}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty">No events yet.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Open alerts</h2>
          <Link to="/alerts" className="btn ghost">All alerts →</Link>
        </div>
        {alerts.length ? (
          <table className="data">
            <thead><tr><th>Time</th><th>Severity</th><th>Player</th><th>Score</th><th>Reason</th><th></th></tr></thead>
            <tbody>
              {alerts.slice(0, 10).map(a => (
                <tr key={a.id}>
                  <td className="mono muted tiny">{fmtTime(a.created_at)}</td>
                  <td><Pill value={a.severity} /></td>
                  <td className="strong">{a.player_name ?? a.player?.name}</td>
                  <td className={`num score ${scoreStatus(a.risk_score)}`}>{a.risk_score}</td>
                  <td className="muted">{a.reason_summary}</td>
                  <td><Link to={`/alerts/${a.id}`} className="btn ghost">Open →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty">No open alerts. Looks calm out there.</div>
        )}
      </section>
    </>
  )
}

const tooltipStyle = {
  background: '#171717',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  color: '#ececec',
  fontSize: 12,
}

function DashboardSkeleton() {
  return (
    <>
      <section className="cards">
        {[0, 1, 2, 3].map(i => <div key={i} className="card"><div className="skeleton" style={{ height: 14, width: 120 }} /><div className="skeleton" style={{ height: 30, width: 80, marginTop: 6 }} /></div>)}
      </section>
      <section className="grid-2">
        <div className="panel"><div className="skeleton" style={{ height: 200 }} /></div>
        <div className="panel"><div className="skeleton" style={{ height: 200 }} /></div>
      </section>
    </>
  )
}
