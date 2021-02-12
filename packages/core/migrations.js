import { QuillDeltaToHtmlConverter } from "quill-delta-to-html";

export const migrations = {
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
      return migrations["5.0"].delta(item);
    },
  },
  5.0: {
    delta: function (item) {
      if (item.conflicted) {
        const deltaConverter = new QuillDeltaToHtmlConverter(
          item.conflicted.data,
          {
            classPrefix: "nn",
            inlineStyles: true,
          }
        );
        item.conflicted.data = deltaConverter.convert();
        item.conflicted.type = "tiny";
        item.conflicted.migrated = true;
      }
      return item;
    },
  },
  5.1: {
    note: false,
    notebook: false,
    tag: false,
    trash: false,
    delta: false,
    settings: false,
  },
};
