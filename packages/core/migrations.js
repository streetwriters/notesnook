import { parseHTML } from "./utils/html-parser";

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

      if (!item.data || item.data.iv) return item;

      item.data = removeToxClassFromChecklist(wrapTablesWithDiv(item.data));
      return item;
    },
    settings: replaceDateEditedWithDateModified(true),
  },
  5.3: {
    note: false,
    notebook: false,
    tag: false,
    attachment: false,
    trash: false,
    tiny: false,
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
    table.replaceWith(
      `<div class="table-container" contenteditable="false">${table.outerHTML}</div>`
    );
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
