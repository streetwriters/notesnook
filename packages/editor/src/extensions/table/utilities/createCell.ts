import { Fragment, Node as ProsemirrorNode, NodeType } from "@tiptap/pm/model";

export function createCell(
  cellType: NodeType,
  cellContent?: Fragment | ProsemirrorNode | Array<ProsemirrorNode>,
  defaultCellAttrs?: { colwidth?: number[] }
): ProsemirrorNode | null | undefined {
  if (cellContent) {
    return cellType.createChecked(defaultCellAttrs, cellContent);
  }

  return cellType.createAndFill(defaultCellAttrs);
}
