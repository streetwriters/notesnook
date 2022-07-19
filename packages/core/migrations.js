import { parseHTML } from "./utils/html-parser";
import { decodeHTML5 } from "entities";

export const migrations = {
  5.0: {},
  5.1: {},
  5.2: {
    note: replaceDateEditedWithDateModified(),
    notebook: replaceDateEditedWithDateModified(),
    tag: replaceDateEditedWithDateModified(true),
    attachment: replaceDateEditedWithDateModified(true),
    trash: replaceDateEditedWithDateModified(),
    tiny: (item) => {
      item = replaceDateEditedWithDateModified()(item);

      if (!item.data || item.data.iv) return migrations["5.3"].tiny(item);

      item.data = removeToxClassFromChecklist(wrapTablesWithDiv(item.data));
      return migrations["5.3"].tiny(item);
    },
    settings: replaceDateEditedWithDateModified(true),
  },
  5.3: {
    tiny: (item) => {
      if (!item.data || item.data.iv) return migrations["5.4"].tiny(item);
      item.data = decodeWrappedTableHtml(item.data);
      return migrations["5.4"].tiny(item);
    },
  },
  5.4: {
    tiny: (item) => {
      if (!item.data || item.data.iv) return item;
      item.type = "tiptap";
      item.data = tinyToTiptap(item.data);
      return item;
    },
  },
  5.5: {},
  5.6: {
    note: false,
    notebook: false,
    tag: false,
    attachment: false,
    trash: false,
    tiny: false,
    tiptap: false,
    settings: false,
  },
};

function replaceDateEditedWithDateModified(removeDateEditedProperty = false) {
  return function (item) {
    item.dateModified = item.dateEdited;
    if (removeDateEditedProperty) delete item.dateEdited;
    delete item.persistDateEdited;
    return item;
  };
}

function wrapTablesWithDiv(html) {
  const document = parseHTML(html);
  const tables = document.getElementsByTagName("table");
  for (let table of tables) {
    table.setAttribute("contenteditable", "true");
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "false");
    div.innerHTML = table.outerHTML;
    div.classList.add("table-container");
    table.replaceWith(div);
  }
  return document.outerHTML || document.body.innerHTML;
}

function removeToxClassFromChecklist(html) {
  const document = parseHTML(html);
  const checklists = document.querySelectorAll(
    ".tox-checklist,.tox-checklist--checked"
  );

  for (let item of checklists) {
    if (item.classList.contains("tox-checklist--checked"))
      item.classList.replace("tox-checklist--checked", "checked");
    else if (item.classList.contains("tox-checklist"))
      item.classList.replace("tox-checklist", "checklist");
  }
  return document.outerHTML || document.body.innerHTML;
}

const regex = /&lt;div class="table-container".*&lt;\/table&gt;&lt;\/div&gt;/gm;
function decodeWrappedTableHtml(html) {
  return html.replaceAll(regex, (match) => {
    const html = decodeHTML5(match);
    return html;
  });
}

const NEWLINE_TOKEN = "[[%NN_NEWLINE_IN_PRE%]]";
const NEWLINE_TOKEN_REGEX = /\[\[%NN_NEWLINE_IN_PRE%\]\]/gm;
const NEWLINE_REPLACEMENT_REGEX = /\n|<br>|<br\/>/gm;
const PREBLOCK_REGEX = /<pre.*<\/pre>/gm;

export function tinyToTiptap(html) {
  if (typeof html !== "string") return html;

  // Preserve newlines in pre blocks
  html = html.replace(PREBLOCK_REGEX, (pre) => {
    return pre.replace(NEWLINE_REPLACEMENT_REGEX, NEWLINE_TOKEN);
  });

  const document = parseHTML(html);

  const tables = document.querySelectorAll("table");
  for (const table of tables) {
    table.removeAttribute("contenteditable");
    if (
      table.parentElement &&
      table.parentElement.nodeName.toLowerCase() === "div"
    ) {
      table.parentElement.replaceWith(table);
    }
  }

  const images = document.querySelectorAll("p > img");
  for (const image of images) {
    image.parentElement.replaceWith(image.cloneNode());
  }

  const breaks = document.querySelectorAll("br");
  for (const br of breaks) {
    br.remove();
  }

  const paragraphs = document.querySelectorAll("p");
  for (const p of paragraphs) {
    if (!p.childNodes.length) p.remove();
  }

  const codeblocks = document.querySelectorAll("pre");
  for (const pre of codeblocks) {
    pre.innerHTML = encodeHTML5(pre.innerText).replace(
      NEWLINE_TOKEN_REGEX,
      "<br/>"
    );
  }

  const bogus = document.querySelectorAll("[data-mce-bogus]");
  for (const element of bogus) {
    element.remove();
  }

  const attributes = document.querySelectorAll(
    "[data-mce-href], [data-mce-flag]"
  );
  for (const element of attributes) {
    element.removeAttribute("data-mce-href");
    element.removeAttribute("data-mce-flag");
  }

  return document.body.innerHTML;
}
