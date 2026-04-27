import type { Status } from './types'

export function scoreStatus(score: number): Status {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'suspicious'
  if (score >= 30) return 'watching'
  return 'normal'
}

export function fmtTime(ts: string | null | undefined): string {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toTimeString().slice(0, 8)
}

export function fmtDateTime(ts: string | null | undefined): string {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

export function timeAgo(ts: string | null | undefined): string {
  if (!ts) return '—'
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 5) return 'just now'
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function avatarFor(name: string): string {
  const initials = (name || '').split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
  return initials || '?'
}

export function isDangerous(action: string, block: string): boolean {
  return /tnt|lava|fire/i.test(action) || /tnt|lava|fire/i.test(block)
}
