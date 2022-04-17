/// <reference types="react" />
import { EditorOptions } from "@tiptap/react";
import Toolbar from "./toolbar";
import { ThemeConfig } from "@notesnook/theme/dist/theme/types";
declare const useTiptap: (options?: Partial<EditorOptions & ThemeConfig>, deps?: import("react").DependencyList | undefined) => import("@tiptap/react").Editor | null;
export { useTiptap, Toolbar };
