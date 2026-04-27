import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { Pill } from '../components/Pill'
import { fmtDateTime, scoreStatus } from '../lib/format'

const SEVERITIES = ['', 'low', 'medium', 'high']
const STATUSES   = ['', 'open', 'reviewing', 'resolved', 'false_positive']

export function Alerts() {
  const [params, setParams] = useSearchParams()
  const severity = params.get('severity') ?? ''
  const status   = params.get('status')   ?? ''

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', severity, status],
    queryFn: () => api.alerts(severity || undefined, status || undefined),
  })

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value); else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <>
      <div className="filters">
        <span className="label">Severity</span>
        <select className="input" value={severity} onChange={e => setParam('severity', e.target.value)}>
          {SEVERITIES.map(s => <option key={s} value={s}>{s || 'any'}</option>)}
        </select>
        <span className="label">Status</span>
        <select className="input" value={status} onChange={e => setParam('status', e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'any'}</option>)}
        </select>
        {(severity || status) && <button className="btn ghost" onClick={() => setParams(new URLSearchParams())}>Reset</button>}
        <span style={{ marginLeft: 'auto' }} className="muted tiny">{alerts.length} alert{alerts.length === 1 ? '' : 's'}</span>
      </div>

      <section className="panel">
        {isLoading ? (
          <div className="skeleton" style={{ height: 300 }} />
        ) : alerts.length === 0 ? (
          <div className="empty">No alerts match those filters.</div>
        ) : (
          <table className="data">
            <thead><tr><th>Time</th><th>Severity</th><th>Status</th><th>Player</th><th>Score</th><th>Summary</th><th></th></tr></thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id}>
                  <td className="mono muted tiny">{fmtDateTime(a.created_at)}</td>
                  <td><Pill value={a.severity} /></td>
                  <td><Pill value={a.status} /></td>
                  <td className="strong">{a.player?.name ?? a.player_name}</td>
                  <td className={`num score ${scoreStatus(a.risk_score)}`}>{a.risk_score}</td>
                  <td className="muted">{a.reason_summary}</td>
                  <td><Link to={`/alerts/${a.id}`} className="btn ghost">Open →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
