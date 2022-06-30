"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableCell = void 0;
var extension_table_cell_1 = __importDefault(require("@tiptap/extension-table-cell"));
exports.TableCell = extension_table_cell_1.default.extend({
    addAttributes: function () {
        var _a;
        return __assign(__assign({}, (_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this)), { backgroundColor: addStyleAttribute("backgroundColor", "background-color"), color: addStyleAttribute("color", "color"), borderWidth: addStyleAttribute("borderWidth", "border-width", "px"), borderStyle: addStyleAttribute("borderStyle", "border-style"), borderColor: addStyleAttribute("borderColor", "border-color") });
    },
});
function addStyleAttribute(name, cssName, unit) {
    return {
        default: null,
        parseHTML: function (element) {
            var _a;
            return unit
                ? (_a = element.style[name]) === null || _a === void 0 ? void 0 : _a.toString().replace(unit, "")
                : element.style[name];
        },
        renderHTML: function (attributes) {
            if (!attributes[name]) {
                return {};
            }
            return {
                style: "".concat(cssName, ": ").concat(attributes[name]).concat(unit || ""),
            };
        },
    };
}
