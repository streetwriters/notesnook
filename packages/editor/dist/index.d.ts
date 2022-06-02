import { EditorOptions } from "./extensions/react";
import Toolbar from "./toolbar";
import { Theme } from "@notesnook/theme";
import { AttachmentOptions } from "./extensions/attachment";
import { PortalProviderAPI } from "./extensions/react/ReactNodeViewPortals";
declare const useTiptap: (options?: Partial<EditorOptions & AttachmentOptions & {
    theme: Theme;
    portalProviderAPI: PortalProviderAPI;
}>, deps?: React.DependencyList) => import("./extensions/react").Editor | null;
export { useTiptap, Toolbar };
export * from "./extensions/react";
