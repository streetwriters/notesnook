/// <reference types="react" />
import { MenuItem } from "./types";
export declare function useFocus(items: MenuItem[], onAction: (event: KeyboardEvent) => void, onClose: (event: KeyboardEvent) => void): {
    focusIndex: number;
    setFocusIndex: import("react").Dispatch<import("react").SetStateAction<number>>;
    isSubmenuOpen: boolean;
    setIsSubmenuOpen: import("react").Dispatch<import("react").SetStateAction<boolean>>;
};
