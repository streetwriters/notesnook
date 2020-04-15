class EventManager {
  constructor() {
    this._registry = {};
  }

  subscribe(name, handler) {
    if (!name || !handler) throw new Error("name and handler are required.");
    if (!this._registry[name]) this._registry.name = [];
    this._registry[name].push(handler);
  }

  unsubscribe(name, handler) {
    if (!this._registry[name]) return;
    const index = this._registry[name].indexOf(handler);
    if (index <= -1) return;
    this._registry[name].splice(index, 1);
  }

  publish(name, ...args) {
    if (!this._registry[name]) return;
    const handlers = this._registry[name];
    handlers.forEach((handler) => {
      handler(...args);
    });
  }
}
export default EventManager;
