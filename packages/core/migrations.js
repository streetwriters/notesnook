export const migrations = {
  0: {
    note: function (item) {
      // note.content -> note.contentId
      if (item.content) {
        const contentId = item.content.delta;
        delete item.content;
        item.contentId = contentId;
      }

      return migrations[2].note(item);
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
      // note.notebook -> note.notebooks
      const notebook = item.notebook;
      delete item.notebook;
      if (notebook && notebook.id && notebook.topic) {
        notebook.topics = [notebook.topics];
        delete notebook.topic;
        item.notebooks = [notebook];
      }

      return migrations[3].note(item);
    },
  },
  3: {
    note: function (item) {
      // note.colors -> note.color
      if (item.colors && item.colors.length > 0) item.color = item.colors.pop();
      delete item.colors;

      return migrations[4].note(item);
    },
  },
  4: {
    note: function (item) {
      if (item.notebooks && item.notebooks.every((n) => !n.id)) {
        item.notebooks = undefined;
      }
      item.dateEdited = Date.now();
      item.migrated = true;
      return item;
    },
  },
  4.1: {},
  4.2: {
    note: false,
    notebook: false,
    tag: false,
    trash: false,
    delta: false,
    settings: false,
  },
};
