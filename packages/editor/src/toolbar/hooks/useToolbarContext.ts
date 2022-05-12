import React, { useContext } from "react";

export const ToolbarContext = React.createContext<{
  currentPopup?: string;
  setCurrentPopup?: React.Dispatch<React.SetStateAction<string | undefined>>;
}>({});

export function useToolbarContext() {
  return useContext(ToolbarContext);
}
