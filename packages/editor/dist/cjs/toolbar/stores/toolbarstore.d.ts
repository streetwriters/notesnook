export declare type ToolbarLocation = "top" | "bottom";
export declare type PopupRef = {
    id: string;
    group: string;
};
interface ToolbarState {
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
export {};
