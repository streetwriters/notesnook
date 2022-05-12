export declare type ToolbarLocation = "top" | "bottom";
interface ToolbarState {
    isMobile: boolean;
    setIsMobile: (isMobile: boolean) => void;
    toolbarLocation: ToolbarLocation;
    setToolbarLocation: (location: ToolbarLocation) => void;
}
export declare const useToolbarStore: import("zustand").UseBoundStore<ToolbarState, import("zustand").StoreApi<ToolbarState>>;
export declare function useToolbarLocation(): ToolbarLocation;
export declare function useIsMobile(): boolean;
export {};
