const templates = require("../utils/template");
const uzip = require("uzip");
const showdown = require("showdown");

let converter = new showdown.Converter();

function makeNote(item, isTrash) {
  let note = templates.note();
  note.title = item.content.split("\r\n")[0];
  note.content.data = converter.makeHtml(
    item.content.replace(note.title + "\r\n", "")
  );
  note.dateCreated = item.creationDate;
  note.dateEdited = item.modifiedDate;
  if (item.pinned) {
    note.pinned = true;
  }
  if (item.tags) {
    note.tags = item.tags;
  }
  if (isTrash) {
    note.deleted = true;
  }

  return note;
}

/**
 *
 * @param  {Array<{data:string | Buffer,createdAt:number,modifiedAt:number,fileName:string}>} files
 * @returns array of notes
 */
function convert(files) {
  let notes = [];

  for (var file of files) {
    let unzip = uzip.parse(file.data);
    if (unzip["source/notes.json"]) {
      let simplenote = JSON.parse(
        Buffer.from(unzip["source/notes.json"].buffer).toString()
      );
      let activeNotes = simplenote.activeNotes;
      let trashNotes = simplenote.trashNotes;
      for (var item of activeNotes) {
        notes.push(makeNote(item));
      }

      for (var item in trashNotes) {
        notes.push(makeNote(item, true));
      }
    } else {
      console.log(
        `${file.fileName} is not a simplenote backup zip file, skipping`
      );
    }
  }
  return notes;
}

module.exports = {
  convert
};
