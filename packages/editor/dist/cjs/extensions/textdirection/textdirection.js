"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextDirection = void 0;
const core_1 = require("@tiptap/core");
require("@tiptap/extension-text-style");
exports.TextDirection = core_1.Extension.create({
    name: "textDirection",
    defaultOptions: {
        types: ["paragraph", "heading"],
        defaultDirection: "ltr",
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    textDirection: {
                        default: this.options.defaultDirection,
                        parseHTML: (element) => element.dir,
                        renderHTML: (attributes) => {
                            if (!attributes.textDirection) {
                                return {};
                            }
                            return {
                                dir: attributes.textDirection,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setTextDirection: (direction) => ({ commands }) => {
                return this.options.types.every((type) => commands.updateAttributes(type, { textDirection: direction }));
            },
        };
    },
});
