import Storage from "./storage";

export default class Indexer extends Storage {
  constructor(context, type) {
    super(context);
    this.type = type;
    this.indices = [];
  }

  async init() {
    this.indices = (await this.read(this.type)) || [];
  }

  async index(key) {
    if (this.indices.length <= 0) {
      this.indices = (await this.read(this.type)) || [];
    }
    this.indices[this.indices.length] = key;
    await this.write(this.type, this.indices);
  }

  async getIndices() {
    if (this.indices.length <= 0) {
      this.indices = (await this.read(this.type)) || [];
    }
    return this.indices;
  }

  async deindex(key) {
    this.indices.splice(this.indices.indexOf(key), 1);
    await this.write(this.type, this.indices);
  }
}
