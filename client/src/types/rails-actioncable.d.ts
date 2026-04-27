declare module '@rails/actioncable' {
  export interface Subscription {
    perform(action: string, data?: object): void
    send(data: object): boolean
    unsubscribe(): void
  }

  export interface SubscriptionCallbacks<T = unknown> {
    connected?(): void
    disconnected?(): void
    rejected?(): void
    received?(data: T): void
    initialized?(): void
  }

  export interface Subscriptions {
    create<T = unknown>(
      channel: string | { channel: string; [key: string]: unknown },
      callbacks?: SubscriptionCallbacks<T>,
    ): Subscription
  }

  export class Consumer {
    subscriptions: Subscriptions
    connect(): void
    disconnect(): void
    ensureActiveConnection(): void
  }

  export function createConsumer(url?: string): Consumer
}
