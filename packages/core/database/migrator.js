import { migrations } from "../migrations";

class Migrator {
  async migrate(collections, get, version) {
    for (let collection of collections) {
      if (!collection.index || !collection.dbCollection) continue;
      for (var i = 0; i < collection.index.length; ++i) {
        let id = collection.index[i];
        let item = get(id);
        if (!item) {
          continue;
        }

        if (item.deleted && !item.type) {
          await collection.dbCollection?._collection?.addItem(item);
          continue;
        }
        const migrate = migrations[version][item.type || collection.type];
        if (migrate) item = migrate(item);

        if (collection.dbCollection.merge) {
          await collection.dbCollection.merge(item);
        } else {
          await collection.dbCollection.add(item);
        }
      }
    }
    return true;
  }
}
export default Migrator;
