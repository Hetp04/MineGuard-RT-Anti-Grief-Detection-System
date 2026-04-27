import type { Alert, AlertStatus, Bootstrap, BlockEvent, Player, Stats } from './types'

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.json() as Promise<T>
}

export const api = {
  bootstrap: () => fetchJSON<Bootstrap>('/api/bootstrap'),
  stats:     () => fetchJSON<Stats>('/api/stats'),

  players: (q?: string, status?: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    const qs = params.toString()
    return fetchJSON<Player[]>(`/api/players${qs ? `?${qs}` : ''}`)
  },
  player: (id: string | number) =>
    fetchJSON<{ player: Player; events: BlockEvent[]; alerts: Alert[]; timeline: Record<string, number> }>(
      `/api/players/${id}`,
    ),

  alerts: (severity?: string, status?: string) => {
    const params = new URLSearchParams()
    if (severity) params.set('severity', severity)
    if (status)   params.set('status',   status)
    const qs = params.toString()
    return fetchJSON<Alert[]>(`/api/alerts${qs ? `?${qs}` : ''}`)
  },
  alert: (id: string | number) =>
    fetchJSON<{ alert: Alert; events: BlockEvent[] }>(`/api/alerts/${id}`),

  updateAlert: (id: string | number, status: AlertStatus) =>
    fetchJSON<Alert>(`/api/alerts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}
