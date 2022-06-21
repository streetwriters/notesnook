import "./extensions";
import { EditorOptions } from "@tiptap/react";
import Toolbar from "./toolbar";
import { Theme } from "@notesnook/theme";
import { AttachmentOptions } from "./extensions/attachment";
import { PortalProviderAPI } from "./extensions/react";
declare const useTiptap: (options?: Partial<EditorOptions & AttachmentOptions & {
    theme: Theme;
    portalProviderAPI: PortalProviderAPI;
}>, deps?: React.DependencyList) => import("@tiptap/react").Editor | null;
export { useTiptap, Toolbar };
export * from "./extensions/react";
