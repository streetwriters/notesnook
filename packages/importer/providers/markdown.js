const templates = require("../utils/template");
const extension = require("../utils/extension");
const showdown = require("showdown");


/**
 *
 * @param  {Array<{data:string | Buffer,createdAt:number,modifiedAt:number,fileName:string}>} files
 * @returns array of notes
 */
function convert(files) {
  let notes = [];
  let converter = new showdown.Converter();
  
  for (var file of files) {
    if (typeof file.data !== "string") {
      file.data = file.data.toString()
    }
    if (extension.get(file.fileName) === "md") {
      let note = templates.note();
      note.content.data = converter.makeHtml(file.data)
      note.dateCreated = file.createdAt;
      note.dateEdited = file.modifiedAt;
      note.title = file.fileName.split(".")[0] || file.data.slice(0, 40);
      notes.push(note);
    } else {
      console.warn(`${file.fileName} is not a markdown file, skipping.`);
    }
  }
  return notes;
}

module.exports = {
  convert
};
