const { getContentFromData } = require("../contenttypes");

const schemas = {
  content: {
    id: { asId: true, store: false },
    noteId: { store: true, index: false },
    data: {
      resolve: (doc) => {
        if (doc.data.iv) return "";
        const content = getContentFromData(doc.type, doc.data);
        return content._text;
      },
      store: false,
      index: true,
    },
  },
  notes: {
    id: { asId: true, store: false },
    title: true,
    // pinned: {
    //   resolve: (doc) => (doc.pinned ? "pinned:true" : "pinned:false"),
    //   index: true,
    //   tokenizer: "strict",
    //   splitter: "-",
    // },
  },
  notebooks: {
    id: { asId: true, store: false },
    title: true,
    description: true,
    topics: {
      resolve: (doc) => {
        if (!doc.topics) return "";
        return doc.topics.map((v) => v.title || v).join(" ");
      },
    },
  },
};

export function getSchema(type) {
  return schemas[type];
}
