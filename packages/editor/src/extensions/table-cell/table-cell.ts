import TiptapTableCell from "@tiptap/extension-table-cell";
import { Attribute } from "@tiptap/core";

export const TableCell = TiptapTableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: addStyleAttribute("backgroundColor", "background-color"),
      color: addStyleAttribute("color", "color"),
      borderWidth: addStyleAttribute("borderWidth", "border-width", "px"),
      borderStyle: addStyleAttribute("borderStyle", "border-style"),
      borderColor: addStyleAttribute("borderColor", "border-color")
    };
  }
});

function addStyleAttribute(
  name: keyof CSSStyleDeclaration,
  cssName: string,
  unit?: string
): Partial<Attribute> {
  return {
    default: null,
    parseHTML: (element) =>
      unit
        ? element.style[name]?.toString().replace(unit, "")
        : element.style[name],
    renderHTML: (attributes) => {
      if (!attributes[name as string]) {
        return {};
      }

      return {
        style: `${cssName}: ${attributes[name as string]}${unit || ""}`
      };
    }
  };
}
