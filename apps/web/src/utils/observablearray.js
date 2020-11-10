import EventManager from "notes-core/utils/eventmanager";

export const EventManagers = {
  redo: new EventManager(),
  undo: new EventManager(),
};
export default class ObservableArray extends Array {
  constructor(type) {
    super();
    this.type = type;
  }

  pop = () => {
    const item = super.pop();
    EventManagers[this.type].publish("pop", this.length);
    return item;
  };

  push = (item) => {
    const n = super.push(item);
    EventManagers[this.type].publish("push", this.length);
    return n;
  };
}
