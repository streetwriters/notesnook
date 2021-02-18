import Storage from "./storage";

export default class Indexer extends Storage {
  constructor(context, type) {
    super(context);
    this.type = type;
    this.indices = [];
  }

  async init() {
    this.indices = (await this.read(this.type, true)) || [];
  }

  exists(key) {
    return this.indices.includes(key);
  }

  async index(key) {
    if (this.exists(key)) return;
    this.indices.push(key);
    await this.write(this.type, this.indices);
  }

  getIndices() {
    return this.indices;
  }

  async deindex(key) {
    if (!this.exists(key)) return;
    this.indices.splice(this.indices.indexOf(key), 1);
    await this.write(this.type, this.indices);
  }

  async clear() {
    this.indices = [];
    await super.clear();
  }
}
