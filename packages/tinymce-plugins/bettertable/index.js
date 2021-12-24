const { addPluginToPluginManager } = require("../utils");

function register(editor) {
  editor.on("BeforeExecCommand", (e) => {
    // override select all: we want to only select the code inside the
    // code block.

    const node = editor.selection.getNode();
    const cell = getTableCell(node);
    if (e.command === "SelectAll" && cell) {
      e.preventDefault();
      editor.selection.select(cell, true);
    }
  });

  let lastSelectedRow = null;
  let lastSelectedCell = null;
  editor.on("SelectionChange", (e) => {
    // to highlight selected row & cell, we need to add data-mce-active
    // attribute to both the row and the cell. CSS styling is done based
    // on that.

    if (lastSelectedRow) delete lastSelectedRow.dataset.mceActive;
    if (lastSelectedCell) delete lastSelectedCell.dataset.mceActive;

    const node = editor.selection.getNode();
    const selectedRow = getTableRow(node);
    if (selectedRow) {
      selectedRow.dataset.mceActive = "1";

      const selectedCell = getTableCell(node);
      if (selectedCell) selectedCell.dataset.mceActive = "1";
      lastSelectedCell = selectedCell;
    }

    lastSelectedRow = selectedRow;
  });

  editor.on("keyup", (e) => {
    // if table is selected, pressing tab should move the focus to the
    // first cell.

    if (e.key === "Tab") {
      const node = editor.selection.getNode();
      if (
        !node.classList.contains("table-container") &&
        node.tagName !== "TABLE"
      )
        return;

      const cell = node.querySelector("th,td");
      if (!cell) return;
      e.preventDefault();
      editor.selection.setCursorLocation(cell, 0);
    }
  });
}

(function init() {
  addPluginToPluginManager("bettertable", register);
})();

function getTableCell(node) {
  const cell = node.closest("td,th");
  return cell;
}

function getTableRow(node) {
  const cell = node.closest("tr");
  return cell;
}
