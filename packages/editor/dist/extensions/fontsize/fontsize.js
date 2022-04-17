import { Extension } from "@tiptap/core";
import "@tiptap/extension-text-style";
export var FontSize = Extension.create({
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
