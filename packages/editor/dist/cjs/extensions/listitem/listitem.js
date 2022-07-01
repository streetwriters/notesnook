"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListItem = void 0;
const extension_list_item_1 = require("@tiptap/extension-list-item");
const commands_1 = require("./commands");
exports.ListItem = extension_list_item_1.ListItem.extend({
    addKeyboardShortcuts() {
        var _a;
        return Object.assign(Object.assign({}, (_a = this.parent) === null || _a === void 0 ? void 0 : _a.call(this)), { Backspace: ({ editor }) => (0, commands_1.onBackspacePressed)(editor, this.name, this.type) });
    },
});
