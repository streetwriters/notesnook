/// <reference types="react" />
import "./extensions";
import Toolbar from "./toolbar";
import { Theme } from "@notesnook/theme";
import { AttachmentOptions } from "./extensions/attachment";
import { EditorOptions } from "@tiptap/core";
declare const useTiptap: (options?: Partial<EditorOptions & AttachmentOptions & {
    theme: Theme;
}>, deps?: import("react").DependencyList) => import("./types").Editor;
export { useTiptap, Toolbar };
export * from "./types";
export * from "./extensions/react";
export * from "./toolbar";
export { type AttachmentType } from "./extensions/attachment";
