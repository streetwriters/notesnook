export default class Debug {
  strip(item) {
    return JSON.stringify({
      type: item.type,
      notebooks: item.notebooks,
      tags: item.tags,
      id: item.id,
      contentId: item.contentId,
      dateEdited: item.dateEdited,
      dateDeleted: item.dateDeleted,
      dateCreated: item.dateCreated,
    });
  }
}
