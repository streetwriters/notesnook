"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderedList = void 0;
const extension_ordered_list_1 = __importDefault(require("@tiptap/extension-ordered-list"));
exports.OrderedList = extension_ordered_list_1.default.extend({
    addAttributes() {
        return {
            listType: {
                default: null,
                parseHTML: (element) => element.style.listStyleType,
                renderHTML: (attributes) => {
                    if (!attributes.listType) {
                        return {};
                    }
                    return {
                        style: `list-style-type: ${attributes.listType}`,
                    };
                },
            },
        };
    },
});
