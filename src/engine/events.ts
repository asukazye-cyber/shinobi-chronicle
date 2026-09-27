import type { ChronicleEntry } from '../domain/types';

/** Runtime notification channel. The chronicle remains the durable, replayable source of truth. */
export class EventBus {
  private listeners = new Set<(event: ChronicleEntry) => void>();
  subscribe(listener: (event: ChronicleEntry) => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  publish(event: ChronicleEntry): void { this.listeners.forEach(listener => listener(event)); }
}
export const simulationEvents = new EventBus();
