"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextDirection = void 0;
var core_1 = require("@tiptap/core");
require("@tiptap/extension-text-style");
exports.TextDirection = core_1.Extension.create({
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
