import { PluginKey } from "prosemirror-state";

export interface Listeners<T> {
  [name: string]: Set<Listener<T>>;
}
export type Listener<T = never> = (data: T) => void;
export type Dispatch<T = never> = (
  eventName: PluginKey | string,
  data: T
) => void;

export class EventDispatcher<T = never> {
  private listeners: Listeners<T> = {};

  on(event: string, cb: Listener<T>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }

    this.listeners[event].add(cb);
  }

  off(event: string, cb: Listener<T>): void {
    if (!this.listeners[event]) {
      return;
    }

    if (this.listeners[event].has(cb)) {
      this.listeners[event].delete(cb);
    }
  }

  emit(event: string, data: T): void {
    if (!this.listeners[event]) {
      return;
    }

    this.listeners[event].forEach((cb) => cb(data));
  }

  destroy(): void {
    this.listeners = {};
  }
}

/**
 * Creates a dispatch function that can be called inside ProseMirror Plugin
 * to notify listeners about that plugin's state change.
 */
export function createDispatch<T>(
  eventDispatcher: EventDispatcher<T>
): Dispatch<T> {
  return (eventName: PluginKey | string, data: T) => {
    if (!eventName) {
      throw new Error("event name is required!");
    }

    const event =
      typeof eventName === "string"
        ? eventName
        : (eventName as PluginKey & { key: string }).key;
    eventDispatcher.emit(event, data);
  };
}
