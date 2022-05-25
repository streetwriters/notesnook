/// <reference types="react" />
import { EditorOptions } from "@tiptap/react";
import Toolbar from "./toolbar";
import { Theme } from "@notesnook/theme";
import { AttachmentOptions } from "./extensions/attachment";
declare const useTiptap: (options?: Partial<EditorOptions & AttachmentOptions & {
    theme: Theme;
}>, deps?: import("react").DependencyList | undefined) => import("@tiptap/react").Editor | null;
export { useTiptap, Toolbar };
