"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FontSize = void 0;
var core_1 = require("@tiptap/core");
require("@tiptap/extension-text-style");
exports.FontSize = core_1.Extension.create({
    name: "fontSize",
    defaultOptions: {
        types: ["textStyle"],
        defaultFontSize: 16,
    },
    addGlobalAttributes: function () {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: "".concat(this.options.defaultFontSize, "px"),
                        parseHTML: function (element) { return element.style.fontSize; },
                        renderHTML: function (attributes) {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: "font-size: ".concat(attributes.fontSize),
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands: function () {
        return {
            setFontSize: function (fontSize) {
                return function (_a) {
                    var chain = _a.chain;
                    return chain().setMark("textStyle", { fontSize: fontSize }).run();
                };
            },
            unsetFontSize: function () {
                return function (_a) {
                    var chain = _a.chain;
                    return chain()
                        .setMark("textStyle", { fontSize: null })
                        .removeEmptyTextStyle()
                        .run();
                };
            },
        };
    },
});
