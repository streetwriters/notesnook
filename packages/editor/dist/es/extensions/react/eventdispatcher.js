export class EventDispatcher {
    constructor() {
        this.listeners = {};
    }
    on(event, cb) {
        if (!this.listeners[event]) {
            this.listeners[event] = new Set();
        }
        this.listeners[event].add(cb);
    }
    off(event, cb) {
        if (!this.listeners[event]) {
            return;
        }
        if (this.listeners[event].has(cb)) {
            this.listeners[event].delete(cb);
        }
    }
    emit(event, data) {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event].forEach((cb) => cb(data));
    }
    destroy() {
        this.listeners = {};
    }
}
/**
 * Creates a dispatch function that can be called inside ProseMirror Plugin
 * to notify listeners about that plugin's state change.
 */
export function createDispatch(eventDispatcher) {
    return (eventName, data) => {
        if (!eventName) {
            throw new Error("event name is required!");
        }
        const event = typeof eventName === "string"
            ? eventName
            : eventName.key;
        eventDispatcher.emit(event, data);
    };
}
