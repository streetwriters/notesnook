class BaseStore {
  static new(set, get) {
    return new this(set, get);
  }

  constructor(set, get) {
    this.set = set;
    this.get = get;
  }
}

export default BaseStore;
