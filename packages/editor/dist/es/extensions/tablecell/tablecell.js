import TiptapTableCell from "@tiptap/extension-table-cell";
export const TableCell = TiptapTableCell.extend({
    addAttributes() {
        var _a;
        return Object.assign(Object.assign({}, (_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this)), { backgroundColor: addStyleAttribute("backgroundColor", "background-color"), color: addStyleAttribute("color", "color"), borderWidth: addStyleAttribute("borderWidth", "border-width", "px"), borderStyle: addStyleAttribute("borderStyle", "border-style"), borderColor: addStyleAttribute("borderColor", "border-color") });
    },
});
function addStyleAttribute(name, cssName, unit) {
    return {
        default: null,
        parseHTML: (element) => {
            var _a;
            return unit
                ? (_a = element.style[name]) === null || _a === void 0 ? void 0 : _a.toString().replace(unit, "")
                : element.style[name];
        },
        renderHTML: (attributes) => {
            if (!attributes[name]) {
                return {};
            }
            return {
                style: `${cssName}: ${attributes[name]}${unit || ""}`,
            };
        },
    };
}
