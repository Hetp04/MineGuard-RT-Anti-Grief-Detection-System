export type Status = 'normal' | 'watching' | 'suspicious' | 'critical'
export type Severity = 'low' | 'medium' | 'high'
export type AlertStatus = 'open' | 'reviewing' | 'resolved' | 'false_positive'

export interface Player {
  id: number
  uuid: string
  name: string
  status: Status
  risk_score: number
  last_action: string | null
  last_block: string | null
  first_seen_at?: string
  last_seen_at: string | null
  alert_count?: number
}

export interface BlockEvent {
  id: number
  player_id?: number
  player_name?: string
  action_type: string
  block_type: string
  x: number; y: number; z: number
  risk_points: number
  occurred_at: string
}

export interface Alert {
  id: number
  severity: Severity
  status: AlertStatus
  risk_score: number
  reason_summary: string
  reasons?: string[]
  metadata?: Record<string, unknown>
  created_at: string
  player_id?: number
  player_name?: string
  player?: Player
}

export interface Stats {
  active_players: number
  watching: number
  open_alerts: number
  highest_score: number
  risk_distribution: { labels: string[]; data: number[] }
  events_per_minute: { labels: string[]; data: number[] }
}

export interface Bootstrap {
  stats: Stats
  players: Player[]
  recent_events: BlockEvent[]
  open_alerts: Alert[]
}

export interface CableEvent {
  type: 'event' | 'player' | 'alert' | 'stats'
  event?: BlockEvent
  player?: Player
  alert?: Alert
  stats?: Stats
}
