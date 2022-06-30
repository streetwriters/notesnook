/// <reference types="react" />
import "./extensions";
import { EditorOptions } from "@tiptap/react";
import Toolbar from "./toolbar";
import { Theme } from "@notesnook/theme";
import { AttachmentOptions } from "./extensions/attachment";
import { Editor } from "./types";
declare const useTiptap: (options?: Partial<EditorOptions & AttachmentOptions & {
    theme: Theme;
}>, deps?: import("react").DependencyList) => Editor | null;
export { useTiptap, Toolbar };
export * from "./types";
export * from "./extensions/react";
export * from "./toolbar/tool-definitions";
