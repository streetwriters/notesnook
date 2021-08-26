/**
 * 
 * @typedef NoteType
 * @property {{data:string,type:"html" | "text"}} content
 * @property {string} title
 * @property {Array<any>} attachments
 * @property {Array<string>} tags
 * @property {boolean} favorite
 * @property {boolean} pinned
 * @property {Array<{notebook:string,topic:string}>} notebooks
 * @property {string} color
 * @property {number} dateCreated
 * @property {number} dateEdited
 * @property {boolean} deleted
 */



const note_template = {
  content: {
    data: "",
    type: "html"
  },
  title: "",
};

/**
 * 
 * @returns {NoteType} A general note template
 */
function note() {
  return { ...note_template };
}

module.exports = {
  note
};
