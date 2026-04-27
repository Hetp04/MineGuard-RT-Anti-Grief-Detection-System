import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../lib/api'
import { Pill } from '../components/Pill'
import { avatarFor, fmtDateTime, fmtTime, scoreStatus } from '../lib/format'
import type { AlertStatus } from '../lib/types'

const STATUSES: AlertStatus[] = ['open', 'reviewing', 'resolved', 'false_positive']

export function AlertDetail() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['alert', id],
    queryFn: () => api.alert(id!),
    enabled: Boolean(id),
  })
  const [status, setStatus] = useState<AlertStatus | ''>('')
  const mutation = useMutation({
    mutationFn: (s: AlertStatus) => api.updateAlert(id!, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alert', id] }),
  })

  if (isLoading || !data) return <div className="skeleton" style={{ height: 400 }} />
  const { alert, events } = data
  const player = alert.player!
  const currentStatus = status || alert.status

  return (
    <>
      <section className="profile-head">
        <div className="avatar">{avatarFor(player.name)}</div>
        <div className="profile-meta">
          <div className="name">
            Alert #{alert.id} <Pill value={alert.severity} /> <Pill value={alert.status} />
          </div>
          <div className="uuid">
            <Link to={`/players/${player.id}`}>{player.name}</Link> · {fmtDateTime(alert.created_at)}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <Link to="/alerts" className="btn ghost">← All alerts</Link>
        </div>
      </section>

      <section className="cards">
        <div className="card">
          <div className="card-label">Risk score</div>
          <div className={`card-value score ${scoreStatus(alert.risk_score)}`}>{alert.risk_score}</div>
        </div>
        <div className="card">
          <div className="card-label">Severity</div>
          <div className="card-value" style={{ fontSize: 20 }}>{alert.severity.toUpperCase()}</div>
        </div>
        <div className="card">
          <div className="card-label">Status</div>
          <div className="card-value" style={{ fontSize: 20 }}>{alert.status.replace(/_/g, ' ').toUpperCase()}</div>
        </div>
        <div className="card">
          <div className="card-label">Player risk now</div>
          <div className={`card-value score ${player.status}`}>{player.risk_score}</div>
          <div className="card-sub">{player.status}</div>
        </div>
      </section>

      <section className="grid-2">
        <div className="panel">
          <div className="panel-head"><h2>Why was this player flagged?</h2></div>
          {alert.reasons && alert.reasons.length > 0 ? (
            <ul className="reasons">{alert.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
          ) : <div className="empty">No reasons recorded for this alert.</div>}
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Update status</h2></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select className="input" value={currentStatus} onChange={e => setStatus(e.target.value as AlertStatus)}>
              {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <button
              className="btn primary"
              onClick={() => mutation.mutate((status || alert.status) as AlertStatus)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving…' : 'Update'}
            </button>
          </div>
          {alert.metadata && (alert.metadata as { breakdown?: Record<string, unknown> }).breakdown && (
            <>
              <h3 style={{ marginTop: 16 }}>Score breakdown</h3>
              <table className="data">
                <tbody>
                  {Object.entries((alert.metadata as { breakdown: Record<string, unknown> }).breakdown).map(([k, v]) => (
                    <tr key={k}>
                      <td className="muted">{k.replace(/_/g, ' ')}</td>
                      <td className="mono">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Supporting events near alert time</h2><span className="muted tiny">{events.length} events</span></div>
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
