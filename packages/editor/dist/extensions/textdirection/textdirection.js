import { Extension } from "@tiptap/core";
import "@tiptap/extension-text-style";
export var TextDirection = Extension.create({
    name: "textDirection",
    defaultOptions: {
        types: ["paragraph", "heading"],
        defaultDirection: "ltr",
    },
    addGlobalAttributes: function () {
        return [
            {
                types: this.options.types,
                attributes: {
                    textDirection: {
                        default: this.options.defaultDirection,
                        parseHTML: function (element) { return element.dir; },
                        renderHTML: function (attributes) {
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
    addCommands: function () {
        var _this = this;
        return {
            setTextDirection: function (direction) {
                return function (_a) {
                    var commands = _a.commands;
                    return _this.options.types.every(function (type) {
                        return commands.updateAttributes(type, { textDirection: direction });
                    });
                };
            },
        };
    },
});
