class EventManager {
  constructor() {
    this._registry = new Map();
  }

  unsubscribeAll() {
    this._registry.clear();
  }

  subscribeMulti(names, handler) {
    names.forEach((name) => {
      this.subscribe(name, handler);
    });
  }

  subscribe(name, handler, once = false) {
    if (!name || !handler) throw new Error("name and handler are required.");
    this._registry.set(handler, { name, once });
  }

  unsubscribe(_name, handler) {
    this._registry.delete(handler);
  }

  publish(name, ...args) {
    this._registry.forEach((props, handler) => {
      if (props.name === name) handler(...args);
      if (props.once) this._registry.delete(handler);
    });
  }

  async publishWithResult(name, ...args) {
    if (!this._registry[name]) return true;
    const handlers = this._registry[name];
    if (handlers.length <= 0) return true;
    return await Promise.all(handlers.map((h) => h.handler(...args)));
  }
}
export default EventManager;
