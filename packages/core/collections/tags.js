import Collection from "../database/collection";

export default class Tags {
  constructor(context) {
    this.collection = new Collection(context, "tags");
  }

  async add(id) {
    if (!id || id.trim().length <= 0) return;
    let tag = (await this.collection.getItem(id)) || {
      id,
      title: id,
      count: 0
    };
    tag.count++;
    await this.collection.addItem(tag);
  }

  all() {
    return this.collection.getAllItems();
  }

  async remove(id) {
    if (!id || id.trim().length <= 0) return;
    let tag = this.collection.getItem(id);
    if (!tag) return;
    if (tag.count <= 1) {
      await this.collection.removeItem(id);
    } else {
      tag.count--;
      await this.collection.addItem(tag);
    }
  }
}
