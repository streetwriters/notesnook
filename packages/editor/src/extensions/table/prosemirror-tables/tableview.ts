import { Node } from "prosemirror-model";
import { NodeView } from "prosemirror-view";
import { CellAttrs } from "./util.js";

/**
 * @public
 */
export class TableView implements NodeView {
  public dom: HTMLDivElement;
  public table: HTMLTableElement;
  public colgroup: HTMLTableColElement;
  public contentDOM: HTMLTableSectionElement;

  constructor(public node: Node, public defaultCellMinWidth: number) {
    this.dom = document.createElement("div");
    this.dom.className = "tableWrapper";
    this.table = this.dom.appendChild(document.createElement("table"));
    this.table.style.setProperty(
      "--default-cell-min-width",
      `${defaultCellMinWidth}px`
    );
    this.colgroup = this.table.appendChild(document.createElement("colgroup"));
    updateColumnsOnResize(node, this.colgroup, this.table, defaultCellMinWidth);
    this.contentDOM = this.table.appendChild(document.createElement("tbody"));
  }

  update(node: Node): boolean {
    if (node.type != this.node.type) return false;
    this.node = node;
    updateColumnsOnResize(
      node,
      this.colgroup,
      this.table,
      this.defaultCellMinWidth
    );
    return true;
  }

  ignoreMutation(record: any): boolean {
    return (
      record.type == "attributes" &&
      (record.target == this.table || this.colgroup.contains(record.target))
    );
  }
}

/**
 * @public
 */
export function updateColumnsOnResize(
  node: Node,
  colgroup: HTMLTableColElement,
  table: HTMLTableElement,
  defaultCellMinWidth: number,
  overrideCol?: number,
  overrideValue?: number
): void {
  let totalWidth = 0;
  let fixedWidth = true;
  let nextDOM = colgroup.firstChild as HTMLElement;
  const row = node.firstChild;
  if (!row) return;

  for (let i = 0, col = 0; i < row.childCount; i++) {
    const { colspan, colwidth } = row.child(i).attrs as CellAttrs;
    for (let j = 0; j < colspan; j++, col++) {
      const hasWidth =
        overrideCol == col ? overrideValue : colwidth && colwidth[j];
      const cssWidth = hasWidth ? hasWidth + "px" : "";
      totalWidth += hasWidth || defaultCellMinWidth;
      if (!hasWidth) fixedWidth = false;
      if (!nextDOM) {
        const col = document.createElement("col");
        col.style.width = cssWidth;
        colgroup.appendChild(col);
      } else {
        if (nextDOM.style.width != cssWidth) {
          nextDOM.style.width = cssWidth;
        }
        nextDOM = nextDOM.nextSibling as HTMLElement;
      }
    }
  }

  while (nextDOM) {
    const after = nextDOM.nextSibling;
    nextDOM.parentNode?.removeChild(nextDOM);
    nextDOM = after as HTMLElement;
  }

  if (fixedWidth) {
    table.style.width = totalWidth + "px";
    table.style.minWidth = "";
  } else {
    table.style.width = "";
    table.style.minWidth = totalWidth + "px";
  }
}
