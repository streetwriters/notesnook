"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FontSize = void 0;
const core_1 = require("@tiptap/core");
require("@tiptap/extension-text-style");
exports.FontSize = core_1.Extension.create({
    name: "fontSize",
    defaultOptions: {
        types: ["textStyle"],
        defaultFontSize: 16,
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: `${this.options.defaultFontSize}px`,
                        parseHTML: (element) => element.style.fontSize,
                        renderHTML: (attributes) => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: (fontSize) => ({ chain }) => {
                return chain().setMark("textStyle", { fontSize }).run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark("textStyle", { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        };
    },
});
