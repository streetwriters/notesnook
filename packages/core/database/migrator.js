import { CURRENT_DATABASE_VERSION } from "../common";
import { migrations } from "../migrations";

class Migrator {
  async migrate(collections, get, version) {
    await Promise.all(
      collections.map(async (collection) => {
        if (!collection.index || !collection.dbCollection) return;

        await Promise.all(
          collection.index.map(async (id) => {
            let item = get(id);
            if (!item) return;
            if (item.deleted)
              return await collection.dbCollection._collection.addItem(item);

            const migrate = migrations[version][item.type || id];
            if (migrate) item = migrate(item);
            if (!!collection.dbCollection.merge) {
              await collection.dbCollection.merge(item);
            } else {
              await collection.dbCollection.add(item);
            }
          })
        );
      })
    );
    return true;
  }
}
export default Migrator;
