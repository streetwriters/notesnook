export const migrations = {
  handleDeleted: async function (db, collection, item) {
    if (item.deleted) {
      await db[collection]._collection.addItem(item);
      return true;
    }
    return false;
  },
  0: {
    notes: async function (db, item) {
      if (await migrations.handleDeleted(db, "notes", item)) return;

      const contentId = item.content.delta;
      const notebook = item.notebook;
      delete item.content;
      delete item.notebook;
      item.contentId = contentId;
      item.remote = true;
      if (notebook) item.notebooks = [notebook];
      await db.notes.add(item);
    },
    delta: async function (db, item) {
      if (await migrations.handleDeleted(db, "content", item)) return;

      item.data = item.data.ops;
      item.type = "delta";
      await db.content.add(item);
    },
    trash: async function (db, item) {
      if (await migrations.handleDeleted(db, "trash", item)) return;

      item.itemType = item.type;
      item.type = "trash";
      if (item.itemType === "note") {
        item.contentId = item.content.delta;
        delete item.content;
      }
      await db.trash.add(item);
    },
    text: function () {},
  },
  2: {
    notes: async function (db, item) {
      if (await migrations.handleDeleted(db, "notes", item)) return;

      // notebook -> notebooks
      const notebook = item.notebook;
      delete item.notebook;
      item.remote = true;
      if (notebook) item.notebooks = [notebook];

      await db.notes.add({ ...item, remote: true });
    },
  },
  3: {
    notes: async function (db, item) {
      if (await migrations.handleDeleted(db, "notes", item)) return;
      await db.notes.add({ ...item, remote: true });
    },
    notebooks: async function (db, item) {
      if (await migrations.handleDeleted(db, "notebooks", item)) return;
      await db.notebooks.add(item);
    },
    tags: async function (db, item) {
      if (await migrations.handleDeleted(db, "tags", item)) return;
      await db.tags.merge(item);
    },
    colors: async function (db, item) {
      if (await migrations.handleDeleted(db, "colors", item)) return;
      await db.colors.merge(item);
    },
    trash: async function (db, item) {
      if (await migrations.handleDeleted(db, "trash", item)) return;
      await db.trash.add(item);
    },
    content: async function (db, item) {
      if (await migrations.handleDeleted(db, "content", item)) return;
      await db.content.add(item);
    },
    settings: async function (db, item) {
      db.settings.merge(item);
    },
  },
};
