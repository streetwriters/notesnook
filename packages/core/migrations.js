import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";

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
      item.migrated = true;
      return migrations["2"].delta(item);
    },
    trash: function (item) {
      item.itemType = item.type;
      item.type = "trash";
      if (item.itemType === "note") {
        item.contentId = item.content.delta;
        delete item.content;
      }
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
        notebook.topics = [notebook.topic];
        delete notebook.topic;
        item.notebooks = [notebook];
      }

      return migrations[3].note(item);
    },
    delta: (item) => migrations["3"].delta(item),
  },
  3: {
    note: function (item) {
      // note.colors -> note.color
      if (item.colors && item.colors.length > 0) item.color = item.colors.pop();
      delete item.colors;

      return migrations[4].note(item);
    },
    delta: (item) => migrations["4"].delta(item),
  },
  4: {
    note: function (item) {
      if (item.notebooks && item.notebooks.every((n) => !n.id)) {
        item.notebooks = undefined;
      }
      return migrations["4.1"].note(item);
    },
    delta: (item) => migrations["4.1"].delta(item),
  },
  4.1: {
    note: function (item) {
      return migrations["4.2"].note(item);
    },
    delta: (item) => migrations["4.2"].delta(item),
  },
  4.2: {
    note: function (item) {
      if (item.notebooks) {
        item.notebooks = item.notebooks.map((nb) => {
          return { id: nb.id, topics: nb.topics || [nb.topic] };
        });
      }
      item.migrated = true;
      return item;
    },
    delta: (item) => migrations["4.3"].delta(item),
  },
  4.3: {
    delta: function (item) {
      const deltaConverter = new QuillDeltaToHtmlConverter(item.data, {
        classPrefix: "nn",
        inlineStyles: true,
      });
      item.data = deltaConverter.convert();
      item.type = "tiny";
      item.migrated = true;
      return item;
    },
  },
  5.0: {
    note: false,
    notebook: false,
    tag: false,
    trash: false,
    delta: false,
    settings: false,
  },
};
