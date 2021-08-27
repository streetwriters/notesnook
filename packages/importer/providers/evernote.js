const templates = require("../utils/template");
const extension = require("../utils/extension");
const dayjs = require("dayjs");
const parser = new window.DOMParser();

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
    if (extension.get(file.fileName) === "enex") {
      let document = parser.parseFromString(file.data, "text/xml");
      let nodes = document.getElementsByTagName("note");
      let notebook = isNotebook(nodes, file.fileName);

      for (var node of nodes) {
        let note = templates.note();
        if (notebook) {
          note.notebooks = getNotebooks(file.fileName);
        }
        note.title = node.querySelector("title").textContent;
        getTags(node, note);
        
        note.dateCreated = getUnixTime(node, "created");
        note.dateEdited = getUnixTime(node, "updated");

        let content = node.querySelector("content").textContent;
        content = content.substring(
          content.lastIndexOf("<en-note>") + 1,
          content.lastIndexOf("</en-note>")
        );
        note.content.data = getHtmlContent(content, node);
        notes.push(note);
      }
    } else {
      console.warn(`${file.fileName} is not a .enex file, skipping.`);
    }
  }
  return notes;
}



/**
 *
 * @param {HTMLCollection} notes
 * @param {string} fileName
 * @returns if this is a notebook
 */
function isNotebook(notes, fileName) {
  if (notes.length > 1) return true;
  let note = notes[0];
  if (note.querySelector("title").textContent !== extension.getName(fileName)) {
    return true;
  }

  return false;
}

/**
 *
 * @param {string} fileName
 * @returns the created notebook using file name
 */
function getNotebooks(fileName) {
  return [{ notebook: extension.getName(fileName), topic: "All notes" }];
}

/**
 *
 * @param {HTMLElement} node
 * @param {import("../utils/template").NoteType} note
 * @returns
 */

function getTags(node, note) {
  let tagNodes = node.querySelectorAll("tag");
  if (tagNodes.length > 0) {
    note.tags = [];
    node.querySelectorAll("tag").forEach((tag) => {
      note.tags.push(tag.textContent);
    });
  }
  return note;
}

/**
 *
 * @param {HTMLElement} node
 * @param {string} selector
 * @returns unix time in milliseconds
 */
function getUnixTime(node, selector) {
  return (
    dayjs(
      node.querySelector(selector).textContent.replace("Z", ""),
      "YYYYMMDDThhmmss"
    ).unix() * 1000
  );
}

/**
 *
 * @param {HTMLDocument} content
 * @param {HTMLElement} node
 * @returns html content with image attachements embeded
 */
function getHtmlContent(content, node) {
  let html = parser.parseFromString(content, "text/html");
  let mediaTags = html.querySelectorAll("en-media");
  let resources = node.querySelectorAll("resource");

  for (var media of mediaTags) {
    if (media.getAttribute("type").includes("image")) {
      let hash = media.getAttribute("hash");
      for (var res of resources) {
        if (res.querySelector("mime").textContent.includes("image")) {
          let url = res.querySelector("source-url").textContent;
          url = url.split("+")[url.split("+").length - 2];
          if (hash === url) {
            let img = html.createElement("img");
            img.src = res.querySelector("data").textContent;
            img.width = res.querySelector("width").textContent;
            img.height = res.querySelector("height").textContent;
            media.parentNode.replaceChild(img, media);
          }
        }
      }
    } else {
      media.parentNode.removeChild(media);
    }
  }

  return html.body.innerHTML;
}

module.exports = {
  convert
};
