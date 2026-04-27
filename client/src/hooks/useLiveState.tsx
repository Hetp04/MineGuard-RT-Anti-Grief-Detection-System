import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { createConsumer, type Consumer } from '@rails/actioncable'
import type { Alert, BlockEvent, CableEvent, Player, Stats } from '../lib/types'

type ConnectionState = 'connecting' | 'online' | 'offline'

interface State {
  connection: ConnectionState
  stats: Stats | null
  players: Player[]
  events: BlockEvent[]
  alerts: Alert[]
  toasts: Alert[]
}

type Action =
  | { type: 'connection'; value: ConnectionState }
  | { type: 'hydrate'; stats: Stats; players: Player[]; events: BlockEvent[]; alerts: Alert[] }
  | { type: 'event'; event: BlockEvent }
  | { type: 'player'; player: Player }
  | { type: 'alert'; alert: Alert }
  | { type: 'stats'; stats: Stats }
  | { type: 'dismissToast'; id: number }

const initial: State = {
  connection: 'connecting',
  stats: null,
  players: [],
  events: [],
  alerts: [],
  toasts: [],
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'connection':
      return { ...s, connection: a.value }
    case 'hydrate':
      return { ...s, stats: a.stats, players: a.players, events: a.events, alerts: a.alerts }
    case 'event':
      return { ...s, events: [a.event, ...s.events].slice(0, 80) }
    case 'player': {
      const i = s.players.findIndex(p => p.id === a.player.id)
      if (i === -1) return { ...s, players: [a.player, ...s.players].slice(0, 50) }
      const next = s.players.slice()
      next[i] = a.player
      next.sort((x, y) => y.risk_score - x.risk_score)
      return { ...s, players: next }
    }
    case 'alert':
      return {
        ...s,
        alerts: [a.alert, ...s.alerts].slice(0, 200),
        toasts: [...s.toasts, a.alert].slice(-4),
      }
    case 'stats':
      return { ...s, stats: a.stats }
    case 'dismissToast':
      return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) }
    default:
      return s
  }
}

interface Ctx extends State {
  hydrate: (b: { stats: Stats; players: Player[]; events: BlockEvent[]; alerts: Alert[] }) => void
  dismissToast: (id: number) => void
}

const LiveContext = createContext<Ctx | null>(null)

export function LiveStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial)
  const consumerRef = useRef<Consumer | null>(null)

  useEffect(() => {
    // Determine cable URL: in dev Vite proxies /cable to Rails over ws.
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${location.host}/cable`
    const consumer = createConsumer(url)
    consumerRef.current = consumer

    const sub = consumer.subscriptions.create({ channel: 'DashboardChannel' }, {
      connected:    () => dispatch({ type: 'connection', value: 'online' }),
      disconnected: () => dispatch({ type: 'connection', value: 'offline' }),
      rejected:     () => dispatch({ type: 'connection', value: 'offline' }),
      received: (data: CableEvent) => {
        switch (data.type) {
          case 'event':  if (data.event)  dispatch({ type: 'event',  event: data.event });   break
          case 'player': if (data.player) dispatch({ type: 'player', player: data.player }); break
          case 'alert':  if (data.alert)  dispatch({ type: 'alert',  alert: data.alert });   break
          case 'stats':  if (data.stats)  dispatch({ type: 'stats',  stats: data.stats });   break
        }
      },
    })

    return () => {
      sub.unsubscribe()
      consumer.disconnect()
    }
  }, [])

  const ctx: Ctx = useMemo(
    () => ({
      ...state,
      hydrate: b => dispatch({ type: 'hydrate', ...b }),
      dismissToast: id => dispatch({ type: 'dismissToast', id }),
    }),
    [state],
  )

  return <LiveContext.Provider value={ctx}>{children}</LiveContext.Provider>
}

export function useLiveState(): Ctx {
  const ctx = useContext(LiveContext)
  if (!ctx) throw new Error('useLiveState must be used inside <LiveStateProvider>')
  return ctx
}
