export const migrations = {
  0: {
    note: function (item) {
      if (item.content) {
        const contentId = item.content.delta;
        delete item.content;
        item.contentId = contentId;
      }
      if (item.notebook) {
        const notebook = item.notebook;
        delete item.notebook;
        item.notebooks = [notebook];
      }
      item.remote = true;
      item.dateEdited = Date.now();
      item.migrated = true;
      return item;
    },
    delta: function (item) {
      item.data = item.data.ops;
      item.type = "delta";
      item.dateEdited = Date.now();
      item.migrated = true;
      return item;
    },
    trash: function (item) {
      item.itemType = item.type;
      item.type = "trash";
      if (item.itemType === "note") {
        item.contentId = item.content.delta;
        delete item.content;
      }
      item.dateEdited = Date.now();
      item.migrated = true;
      return item;
    },
  },
  2: {
    note: function (item) {
      // notebook -> notebooks
      const notebook = item.notebook;
      delete item.notebook;
      item.remote = true;
      if (notebook) item.notebooks = [notebook];
      item.dateEdited = Date.now();
      item.migrated = true;
      return item;
    },
  },
  3: {
    note: false,
    notebooks: false,
    tag: false,
    trash: false,
    delta: false,
    settings: false,
  },
};
