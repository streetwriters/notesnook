import React, { useContext } from "react";
export var ToolbarContext = React.createContext({});
export function useToolbarContext() {
    return useContext(ToolbarContext);
}
