class Session {
  /**
   *
   * @param {import("../database/storage").default} context
   */
  constructor(context) {
    this._context = context;
  }

  get() {
    return this._context.read("t");
  }

  set() {
    return this._context.write("t", Date.now());
  }

  async valid() {
    const t = await this.get();
    return !t || t < Date.now();
  }
}
export default Session;
