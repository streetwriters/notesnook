import React, { useContext } from "react";

export type ToolbarLocation = "top" | "bottom";

export const ToolbarContext = React.createContext<{
  currentPopup?: string;
  setCurrentPopup?: React.Dispatch<React.SetStateAction<string | undefined>>;
  toolbarLocation?: ToolbarLocation;
}>({});

export function useToolbarContext() {
  return useContext(ToolbarContext);
}
