import { useEffect } from 'react'
import { useLiveState } from '../hooks/useLiveState'

export function ToastHost() {
  const { toasts, dismissToast } = useLiveState()

  useEffect(() => {
    const timers = toasts.map(t => setTimeout(() => dismissToast(t.id), 6000))
    return () => { timers.forEach(clearTimeout) }
  }, [toasts, dismissToast])

  return (
    <div className="toast-host">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.severity}`}>
          <div className="toast-title">
            {t.severity.toUpperCase()} · {t.player_name ?? t.player?.name ?? 'unknown'}
          </div>
          <div className="toast-body">{t.reason_summary}</div>
        </div>
      ))}
    </div>
  )
}
