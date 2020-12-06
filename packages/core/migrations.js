export const migrations = {
  0: {
    note: function (item) {
      const contentId = item.content.delta;
      const notebook = item.notebook;
      delete item.content;
      delete item.notebook;
      item.contentId = contentId;
      item.remote = true;
      if (notebook) item.notebooks = [notebook];
      return item;
    },
    delta: function (item) {
      item.data = item.data.ops;
      item.type = "delta";
      return item;
    },
    trash: function (item) {
      item.itemType = item.type;
      item.type = "trash";
      if (item.itemType === "note") {
        item.contentId = item.content.delta;
        delete item.content;
      }
      return item;
    },
    text: function () {},
  },
  2: {
    note: function (item) {
      // notebook -> notebooks
      const notebook = item.notebook;
      delete item.notebook;
      item.remote = true;
      if (notebook) item.notebooks = [notebook];
      return item;
    },
  },
  3: {
    note: false,
    notebooks: function (item) {
      if (item.favorite !== undefined) delete item.favorite;
      return item;
    },
    tag: false,
    trash: false,
    content: false,
    settings: false,
  },
};
