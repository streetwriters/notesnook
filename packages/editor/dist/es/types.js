import { Editor as TiptapEditor } from "@tiptap/core";
export class Editor extends TiptapEditor {
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
