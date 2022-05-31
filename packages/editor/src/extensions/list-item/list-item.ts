import { ListItem as TiptapListItem } from "@tiptap/extension-list-item";
import { EditorState } from "prosemirror-state";
import { NodeType } from "prosemirror-model";
import { findParentNodeOfType, hasParentNodeOfType } from "prosemirror-utils";
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
