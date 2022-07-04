"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Editor = void 0;
const core_1 = require("@tiptap/core");
class Editor extends core_1.Editor {
    /**
     * Request permission before executing a command to make sure user
     * is allowed to perform the action.
     * @param id the command id to get permission for
     * @returns latest editor instance
     */
    requestPermission(id) {
        const event = new CustomEvent("permissionrequest", {
            detail: { id },
            cancelable: true,
        });
        if (!window.dispatchEvent(event))
            return undefined;
        return this.current;
    }
}
exports.Editor = Editor;
