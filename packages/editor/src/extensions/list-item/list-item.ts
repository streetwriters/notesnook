import { ListItem as TiptapListItem } from "@tiptap/extension-list-item";
import { onBackspacePressed } from "./commands";

export const ListItem = TiptapListItem.extend({
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Tab: (props) => {
        const { editor } = props;
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        if ($from.parent.type.name === "codeblock") return false;

        return this.parent?.()?.Tab(props) || false;
      },
      Backspace: ({ editor }) =>
        onBackspacePressed(editor, this.name, this.type),
    };
  },
});
