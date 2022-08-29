import React from "react";
import { View } from "react-native";
import { useSelectionStore } from "../../stores/use-selection-store";
import { useThemeStore } from "../../stores/use-theme-store";

export const ContainerHeader = ({ children }) => {
  const colors = useThemeStore((state) => state.colors);
  const selectionMode = useSelectionStore((state) => state.selectionMode);

  return !selectionMode ? (
    <View
      style={{
        backgroundColor: colors.bg,
        width: "100%",
        overflow: "hidden"
      }}
    >
      {children}
    </View>
  ) : null;
};
