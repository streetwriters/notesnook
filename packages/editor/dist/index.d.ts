import { EditorOptions } from "@tiptap/react";
import Toolbar from "./toolbar";
import { ThemeConfig } from "@notesnook/theme/dist/theme/types";
import { AttachmentOptions } from "./extensions/attachment";
declare const useTiptap: (options?: Partial<EditorOptions & ThemeConfig & AttachmentOptions>, deps?: import("react").DependencyList | undefined) => import("@tiptap/react").Editor | null;
export { useTiptap, Toolbar };
