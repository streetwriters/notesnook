import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeView } from "@tiptap/pm/view";
import { updateColumnsOnResize } from "./prosemirror-tables/tableview.js";

export class TableView implements NodeView {
  node: ProseMirrorNode;

  cellMinWidth: number;

  dom: HTMLElement;

  table: HTMLTableElement;

  colgroup: HTMLTableColElement;

  contentDOM: HTMLElement;

  constructor(node: ProseMirrorNode, cellMinWidth: number) {
    this.node = node;
    this.cellMinWidth = cellMinWidth;
    this.dom = document.createElement("div");
    this.dom.className = "tableWrapper";
    this.table = this.dom.appendChild(document.createElement("table"));
    this.colgroup = this.table.appendChild(document.createElement("colgroup"));
    updateColumnsOnResize(node, this.colgroup, this.table, cellMinWidth);
    this.contentDOM = this.table.appendChild(document.createElement("tbody"));
  }

  update(node: ProseMirrorNode) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    updateColumnsOnResize(node, this.colgroup, this.table, this.cellMinWidth);

    return true;
  }

  ignoreMutation(
    mutation: MutationRecord | { type: "selection"; target: Element }
  ) {
    return (
      mutation.type === "attributes" &&
      (mutation.target === this.table ||
        this.colgroup.contains(mutation.target))
    );
  }
}
