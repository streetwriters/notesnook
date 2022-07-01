import { ListItem as TiptapListItem } from "@tiptap/extension-list-item";
import { onBackspacePressed } from "./commands";
export const ListItem = TiptapListItem.extend({
    addKeyboardShortcuts() {
        var _a;
        return Object.assign(Object.assign({}, (_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this)), { Backspace: ({ editor }) => onBackspacePressed(editor, this.name, this.type) });
    },
});
