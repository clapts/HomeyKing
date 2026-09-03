import type { HomeEvent, HomeEventType } from './HomeEvent';

export type EventHandler<TPayload = unknown> = (event: HomeEvent<TPayload>) => void | Promise<void>;

export class EventBus {
  private readonly handlers = new Map<HomeEventType, Set<EventHandler>>();

  on<TPayload = unknown>(type: HomeEventType, handler: EventHandler<TPayload>): () => void {
    const set = this.handlers.get(type) ?? new Set<EventHandler>();
    set.add(handler as EventHandler);
    this.handlers.set(type, set);

    return () => set.delete(handler as EventHandler);
  }

  async emit<TPayload = unknown>(event: HomeEvent<TPayload>): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers) return;

    for (const handler of handlers) {
      await handler(event);
    }
  }
}
