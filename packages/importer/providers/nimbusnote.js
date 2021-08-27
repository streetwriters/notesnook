const templates = require("../utils/template");
const uzip = require("uzip");
const extension = require("../utils/extension");
const parser = new window.DOMParser();

function getNotebook(path) {
  let parts = path.split("/");
  let notebook = parts[2];
  let topic = "All notes";
  if (parts.length > 3) {
    topic = parts[parts.length - 2];
  }

  return {
    notebook,
    topic
  };
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
    let zipName = extension.getName(file.fileName);
    items = items.filter((i) => i.startsWith(zipName) && extension.get(i));

    if (items.find((i) => i.includes(`${zipName}/All Notes`))) {
      for (zip of items) {
        let raw = uzip.parse(unzip[zip]);
        let html = Buffer.from(raw["note.html"].buffer).toString();
        html = parser.parseFromString(html, "text/html");

        let note = templates.note();
        note.title = html.title;
        note.notebooks = getNotebook(zip);
        let images = html.getElementsByClassName("image-wrapper");
        if (images.length > 0) {
          for (let image of images) {
            let imageNode = image.querySelector("img");
            if (imageNode) {
              let base64 = Buffer.from(
                raw[imageNode.src.replace("./", "")].buffer
              ).toString("base64");
              let img = html.createElement("img");
              img.src = base64;
              img.width = imageNode.width;
              image.parentElement.replaceChild(img, image);
            }
          }
        }
        note.content.data = html.body.innerHTML.trim();
        notes.push(note);
      }
    } else {
      console.warn(
        `${file.fileName} is not a nimbus note exported zip file, skipping`
      );
    }
  }
  return notes;
}

module.exports = {
  convert
};
