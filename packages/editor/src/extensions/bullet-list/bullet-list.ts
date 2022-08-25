import TiptapBulletList from "@tiptap/extension-bullet-list";

export const BulletList = TiptapBulletList.extend({
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
