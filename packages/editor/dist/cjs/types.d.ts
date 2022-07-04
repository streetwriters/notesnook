import { UnionCommands, Editor as TiptapEditor } from "@tiptap/core";
export interface PermissionRequestEvent extends CustomEvent<{
    id: keyof UnionCommands;
}> {
}
export declare class Editor extends TiptapEditor {
    /**
     * Use this to get the latest instance of the editor.
     * This is required to reduce unnecessary rerenders of
     * toolbar elements.
     */
    current?: TiptapEditor;
    /**
     * Request permission before executing a command to make sure user
     * is allowed to perform the action.
     * @param id the command id to get permission for
     * @returns latest editor instance
     */
    requestPermission(id: keyof UnionCommands): TiptapEditor | undefined;
}
