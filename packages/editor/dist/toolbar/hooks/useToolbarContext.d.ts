import React from "react";
export declare const ToolbarContext: React.Context<{
    currentPopup?: string | undefined;
    setCurrentPopup?: React.Dispatch<React.SetStateAction<string | undefined>> | undefined;
}>;
export declare function useToolbarContext(): {
    currentPopup?: string | undefined;
    setCurrentPopup?: React.Dispatch<React.SetStateAction<string | undefined>> | undefined;
};
