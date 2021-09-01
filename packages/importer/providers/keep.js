const templates = require("../utils/template");
const uzip = require("uzip");
const extension = require("../utils/extension");
const texttohtml = require("../utils/texttohtml");
const parser = new window.DOMParser();

const colors = {
  red: "red",
  orange: "orange",
  yellow: "yellow",
  green: "green",
  teal: "green",
  cerulean: "blue",
  blue: "blue",
  pink: "purple",
  purple: "purple",
  gray: "gray",
  brown: "orange"
};

/**
 * 
 * @param {object} keepNote A google keep note object
 * @returns parsed html list from json.
 */
function makeListHtml(keepNote) {
  let content = '<ul class="tox-checklist">';
  for (item of keepNote.listContent) {
    content += `<li class="${
      item.isChecked ? "tox-checklist--checked" : ""
    }" >${item.text}</li>`;
  }
  content += "</ul>";
  return content;
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
    let items = Object.keys(unzip);
    if (items.find((i) => i.includes("Takeout/Keep"))) {
      let noteKeys = items.filter((i) => i.endsWith(".json"));
      let imageKeys = items.filter(
        (i) => i.endsWith("png") || i.endsWith("jpg") || i.endsWith("jpeg")
      );

      for (let key of noteKeys) {
        let keepNote = JSON.parse(Buffer.from(unzip[key].buffer).toString());
        let note = templates.note();

        note.title =
          keepNote.title !== ""
            ? keepNote.title
            : keepNote.textContent
            ? keepNote.textContent.slice(0, 40)
            : keepNote.listContent
            ? "Untitled list " + noteKeys.indexOf(key)
            : "Untitled note " + noteKeys.indexOf(key);

        if (keepNote.textContent) {
          note.content.data = texttohtml.convert(keepNote.textContent);
        }
        if (keepNote.isPinned) {
          note.pinned = true;
        }
        if (keepNote.isTrashed) {
          note.deleted = true;
        }
        note.dateEdited = keepNote.userEditedTimestampUsec / 1000;
        if (keepNote.labels) {
          note.tags = keepNote.labels.map((label) => label.name);
        }
        if (keepNote.listContent) {
          note.content.data = makeListHtml(keepNote);
        }
        if (keepNote.color && keepNote.color !== "DEFAULT") {
          note.color = colors[keepNote.color.toLowerCase()];
        }

        if (keepNote.attachments) {
          let html = parser.parseFromString(note.content.data, "text/html");
          for (let attachment of keepNote.attachments) {
            let name = imageKeys.find((k) =>
              k.includes(extension.getName(attachment.filePath))
            );
            let base64 = Buffer.from(unzip[name].buffer).toString("base64");
            let img = html.createElement("img");
            img.src = base64;
            html.body.appendChild(img);
          }
          note.content.data = html.body.innerHTML;
        }
        notes.push(note);
      }
    } else {
      console.warn(
        `${file.fileName} is not a google takeout exported zip file, skipping`
      );
    }
  }
  return notes;
}

module.exports = {
  convert
};
