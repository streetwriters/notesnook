import { Theme } from "@streetwriters/theme";
export declare type ToolbarLocation = "top" | "bottom";
export declare type PopupRef = {
    id: string;
    group: string;
};
interface ToolbarState {
    theme?: Theme;
    setTheme: (theme?: Theme) => void;
    isMobile: boolean;
    openedPopups: Record<string, PopupRef | false>;
    setIsMobile: (isMobile: boolean) => void;
    toolbarLocation: ToolbarLocation;
    setToolbarLocation: (location: ToolbarLocation) => void;
    isPopupOpen: (popupId: string) => boolean;
    openPopup: (ref: PopupRef) => void;
    closePopup: (popupId: string) => void;
    closePopupGroup: (groupId: string, excluded: string[]) => void;
}
export declare const useToolbarStore: import("zustand").UseBoundStore<ToolbarState, import("zustand").StoreApi<ToolbarState>>;
export declare function useToolbarLocation(): ToolbarLocation;
export declare function useIsMobile(): boolean;
export declare const useTheme: (() => Theme | undefined) & {
    theme: Theme | undefined;
};
export {};
