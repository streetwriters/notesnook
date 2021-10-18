class Session {
  /**
   *
   * @param {import("../database/storage").default} context
   */
  constructor(context) {
    this._storage = context;
  }

  get() {
    return this._storage.read("t");
  }

  set() {
    return this._storage.write("t", Date.now());
  }

  async valid() {
    const t = await this.get();
    return !t || t < Date.now();
  }
}
export default Session;
