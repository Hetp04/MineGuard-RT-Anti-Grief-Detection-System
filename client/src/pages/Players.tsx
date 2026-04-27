import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { Pill } from '../components/Pill'
import { avatarFor, fmtTime } from '../lib/format'

const STATUSES = ['', 'normal', 'watching', 'suspicious', 'critical']

export function Players() {
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? '')

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players', params.get('q') ?? '', params.get('status') ?? ''],
    queryFn: () => api.players(params.get('q') ?? undefined, params.get('status') ?? undefined),
  })

  const apply = (e: React.FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams()
    if (q) next.set('q', q)
    if (status) next.set('status', status)
    setParams(next, { replace: true })
  }

  return (
    <>
      <form className="filters" onSubmit={apply}>
        <span className="label">Filter</span>
        <input className="input" style={{ width: 240 }} placeholder="Name or UUID…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
        </select>
        <button type="submit" className="btn primary">Apply</button>
        {(q || status) && <button type="button" className="btn ghost" onClick={() => { setQ(''); setStatus(''); setParams(new URLSearchParams()) }}>Reset</button>}
        <span style={{ marginLeft: 'auto' }} className="muted tiny">{players.length} player{players.length === 1 ? '' : 's'}</span>
      </form>

      <section className="panel">
        {isLoading ? (
          <div className="skeleton" style={{ height: 280 }} />
        ) : players.length === 0 ? (
          <div className="empty">No players match those filters.</div>
        ) : (
          <table className="data">
            <thead><tr><th>Player</th><th>Risk</th><th>Status</th><th>Last action</th><th>Last seen</th><th></th></tr></thead>
            <tbody>
              {players.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 13, borderRadius: 8 }}>{avatarFor(p.name)}</div>
                      <div>
                        <div className="strong">{p.name}</div>
                        <div className="muted tiny mono">{p.uuid}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`num score ${p.status}`}>{p.risk_score}</td>
                  <td><Pill value={p.status} /></td>
                  <td>
                    <span className="muted">{p.last_action?.replace(/_/g, ' ')}</span>{' '}
                    <span className="mono tiny dim">{p.last_block}</span>
                  </td>
                  <td className="mono muted tiny">{fmtTime(p.last_seen_at)}</td>
                  <td><Link to={`/players/${p.id}`} className="btn ghost">View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
