import React from "react";
export declare type ToolbarLocation = "top" | "bottom";
export declare const ToolbarContext: React.Context<{
    currentPopup?: string | undefined;
    setCurrentPopup?: React.Dispatch<React.SetStateAction<string | undefined>> | undefined;
    toolbarLocation?: ToolbarLocation | undefined;
}>;
export declare function useToolbarContext(): {
    currentPopup?: string | undefined;
    setCurrentPopup?: React.Dispatch<React.SetStateAction<string | undefined>> | undefined;
    toolbarLocation?: ToolbarLocation | undefined;
};
