import TiptapOrderedList from "@tiptap/extension-ordered-list";

export const OrderedList = TiptapOrderedList.extend({
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
            style: `list-style-type: ${attributes.listType}`
          };
        }
      }
    };
  }
});
