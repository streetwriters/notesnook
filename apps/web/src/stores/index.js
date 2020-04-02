class BaseStore {
  static new(set, get) {
    return new this(set, get);
  }

  constructor(set, get) {
    this.set = set;
    this.get = get;
    this.id = Math.random();
  }
}

export default BaseStore;
