const { getContentFromData } = require("../contenttypes");
const { qclone } = require("qclone");

const onlyStore = { store: true, index: false };
const indexAndStore = { store: true, index: true };
const asId = { asId: true };

const basicItem = {
  id: asId,
  deleted: onlyStore,
  dateCreated: onlyStore,
  dateEdited: onlyStore,
  type: onlyStore,
};

const schemas = {
  content: {
    ...basicItem,
    noteId: onlyStore,
    conflicted: onlyStore,
    resolved: onlyStore,
    data: {
      resolve: (doc) => {
        if (!doc.data || doc.data.iv) return "";
        const content = getContentFromData(doc.type, doc.data);
        return content._text;
      },
      store: true,
      index: true,
    },
  },
  notes: {
    ...basicItem,
    locked: onlyStore,
    colors: onlyStore,
    tags: onlyStore,
    conflicted: onlyStore,
    contentId: onlyStore,
    pinned: onlyStore,
    favorite: onlyStore,
    title: indexAndStore,
    headline: onlyStore,
    notebook: onlyStore,
    // pinned: {
    //   resolve: (doc) => (doc.pinned ? "pinned:true" : "pinned:false"),
    //   index: true,
    //   tokenizer: "strict",
    //   splitter: "-",
    // },
  },
  notebooks: {
    ...basicItem,
    title: indexAndStore,
    description: indexAndStore,
    totalNotes: onlyStore,
    pinned: onlyStore,
    topics: {
      resolve: (doc) => {
        if (!doc.topics) return "";
        return doc.topics.map((v) => v.title || v).join(" ");
      },
      ...indexAndStore,
    },
  },
  colors: {
    ...basicItem,
    merge: ["tags"],
  },
  tags: {
    ...basicItem,
    noteIds: onlyStore,
    deletedIds: onlyStore,
    title: indexAndStore,
  },
  trash: {
    id: asId,
    dateDeleted: onlyStore,
    itemType: onlyStore,
    itemId: onlyStore,
    merge: ["notes", "notebooks"],
  },
};

export function getSchema(type) {
  let schema = qclone(schemas[type]);
  if (schema.merge) {
    const mergeSchemas = schema.merge;
    delete schema.merge;
    mergeSchemas.forEach((key) => {
      schema = { ...schema, ...schemas[key] };
    });
  }
  return schema;
}
