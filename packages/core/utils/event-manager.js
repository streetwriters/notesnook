class EventManager {
  constructor() {
    this._registry = new Map();
  }

  unsubscribeAll() {
    this._registry.clear();
  }

  subscribeMulti(names, handler, thisArg) {
    names.forEach((name) => {
      this.subscribe(name, handler.bind(thisArg));
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
    const handlers = [];
    this._registry.forEach((props, handler) => {
      if (props.name === name) handlers.push(handler);
      if (props.once) this._registry.delete(handler);
    });

    if (handlers.length <= 0) return true;
    return await Promise.all(handlers.map((handler) => handler(...args)));
  }

  remove(...names) {
    this._registry.forEach((props, handler) => {
      if (names.includes(props.name)) this._registry.delete(handler);
    });
  }
}
export default EventManager;
