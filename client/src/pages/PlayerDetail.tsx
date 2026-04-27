import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../lib/api'
import { Pill } from '../components/Pill'
import { avatarFor, fmtTime, scoreStatus, timeAgo } from '../lib/format'

export function PlayerDetail() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: () => api.player(id!),
    enabled: Boolean(id),
  })

  if (isLoading || !data) return <div className="skeleton" style={{ height: 400 }} />

  const { player, events, alerts, timeline } = data

  const labels: string[] = []
  const values: number[] = []
  const now = new Date()
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60_000)
    const key = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    labels.push(key)
    values.push(timeline[key] ?? 0)
  }
  const chartData = labels.map((t, i) => ({ t, v: values[i] }))

  return (
    <>
      <section className="profile-head">
        <div className="avatar">{avatarFor(player.name)}</div>
        <div className="profile-meta">
          <div className="name">{player.name} <Pill value={player.status} /></div>
          <div className="uuid">{player.uuid}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Link to="/players" className="btn ghost">← Back to players</Link>
        </div>
      </section>

      <section className="cards">
        <div className="card">
          <div className="card-label">Risk score</div>
          <div className={`card-value score ${player.status}`}>{player.risk_score}</div>
          <div className="card-sub">0–100 · live</div>
        </div>
        <div className="card">
          <div className="card-label">Last action</div>
          <div className="card-value" style={{ fontSize: 18 }}>{player.last_action?.replace(/_/g, ' ') ?? '—'}</div>
          <div className="card-sub mono">{player.last_block}</div>
        </div>
        <div className="card">
          <div className="card-label">Last seen</div>
          <div className="card-value" style={{ fontSize: 18 }}>{fmtTime(player.last_seen_at)}</div>
          <div className="card-sub">{timeAgo(player.last_seen_at)}</div>
        </div>
        <div className="card">
          <div className="card-label">Recent alerts</div>
          <div className="card-value">{alerts.length}</div>
          <div className="card-sub">{alerts.filter(a => a.status === 'open').length} open</div>
        </div>
      </section>

      <section className="grid-2">
        <div className="panel">
          <div className="panel-head"><h2>Activity · last 15m</h2></div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="t" stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b6b6b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#171717', border: '1px solid #2a2a2a', borderRadius: 8, color: '#ececec', fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="v" fill="rgba(236,236,236,0.6)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Recent alerts</h2></div>
          {alerts.length ? (
            <table className="data">
              <thead><tr><th>Time</th><th>Sev</th><th>Score</th><th>Reason</th></tr></thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id}>
                    <td className="mono muted tiny">{fmtTime(a.created_at)}</td>
                    <td><Pill value={a.severity} /></td>
                    <td className={`num score ${scoreStatus(a.risk_score)}`}>{a.risk_score}</td>
                    <td><Link to={`/alerts/${a.id}`} className="muted">{a.reason_summary}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty">No alerts for this player.</div>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Recent block events</h2><span className="muted tiny">{events.length} events</span></div>
        <table className="data">
          <thead><tr><th>Time</th><th>Action</th><th>Block</th><th>Coords</th><th>Risk pts</th></tr></thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id}>
                <td className="mono muted tiny">{fmtTime(e.occurred_at)}</td>
                <td>{e.action_type.replace(/_/g, ' ')}</td>
                <td className="mono">{e.block_type}</td>
                <td className="mono muted">({e.x}, {e.y}, {e.z})</td>
                <td className="num">{e.risk_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
