import { ListItem as TiptapListItem } from "@tiptap/extension-list-item";
import { onBackspacePressed } from "./commands";

export const ListItem = TiptapListItem.extend({
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Backspace: ({ editor }) =>
        onBackspacePressed(editor, this.name, this.type),
    };
  },
});
