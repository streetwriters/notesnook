const templates = require("../utils/template");
const textToHtml = require("../utils/texttohtml");
const extension = require("../utils/extension");
/**
 *
 * @param  {Array<{data:string | Buffer,createdAt:number,modifiedAt:number,fileName:string}>} files
 * @returns array of notes
 */
function convert(files) {
  let notes = [];
  for (var file of files) {
    if (typeof file.data !== "string") {
      file.data = file.data.toString()
    }
    if (extension.get(file.fileName) === "txt") {
      let note = templates.note();
      note.content.data = textToHtml.convert(file.data);
      note.dateCreated = file.createdAt;
      note.dateEdited = file.modifiedAt;
      note.content.type = "text";
      note.title = file.fileName.split(".")[0] || file.data.slice(0, 40);
      notes.push(note);
    } else {
      console.warn(`${file.fileName} is not a text file, skipping.`);
    }
  }
  return notes;
}

module.exports = {
  convert
};
