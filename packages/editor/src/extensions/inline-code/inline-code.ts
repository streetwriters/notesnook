import Code from "@tiptap/extension-code";

export const InlineCode = Code.extend({
  excludes: "link",
  addAttributes() {
    return {
      ...this.parent?.(),
      spellcheck: {
        default: "false",
        parseHTML: (element) => element.getAttribute("spellcheck"),
        renderHTML: (attributes) => {
          if (!attributes.spellcheck) {
            return {};
          }
          return {
            spellcheck: attributes.spellcheck
          };
        }
      }
    };
  }
});
