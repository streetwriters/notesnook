"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderedList = void 0;
var extension_ordered_list_1 = __importDefault(require("@tiptap/extension-ordered-list"));
exports.OrderedList = extension_ordered_list_1.default.extend({
    addAttributes: function () {
        return {
            listType: {
                default: null,
                parseHTML: function (element) { return element.style.listStyleType; },
                renderHTML: function (attributes) {
                    if (!attributes.listType) {
                        return {};
                    }
                    return {
                        style: "list-style-type: ".concat(attributes.listType),
                    };
                },
            },
        };
    },
});
