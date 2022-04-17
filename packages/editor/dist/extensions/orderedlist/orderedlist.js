import TiptapOrderedList from "@tiptap/extension-ordered-list";
export var OrderedList = TiptapOrderedList.extend({
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
