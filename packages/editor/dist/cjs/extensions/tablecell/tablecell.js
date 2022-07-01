"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableCell = void 0;
const extension_table_cell_1 = __importDefault(require("@tiptap/extension-table-cell"));
exports.TableCell = extension_table_cell_1.default.extend({
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
