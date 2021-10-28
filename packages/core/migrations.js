export const migrations = {
  4: {
    note: function (item) {
      if (item.notebooks && item.notebooks.every((n) => !n.id)) {
        item.notebooks = undefined;
      }
      return migrations["4.1"].note(item);
    },
  },
  4.1: {
    note: function (item) {
      return migrations["4.2"].note(item);
    },
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
  },
  4.3: {},
  5.0: {},
  5.1: {},
  5.2: {
    note: false,
    notebook: false,
    tag: false,
    attachment: false,
    trash: false,
    tiny: false,
    settings: false,
  },
};
