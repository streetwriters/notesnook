import { View } from "react-native";
import { useThemeStore } from "../../../stores/use-theme-store";
import { useEditorStore } from "../../../stores/use-editor-store";
import { hexToRGBA } from "../../../utils/color-scheme/utils";

export const Filler = ({ item }) => {
  const colors = useThemeStore((state) => state.colors);

  const currentEditingNote = useEditorStore(
    (state) => state.currentEditingNote
  );

  const color = "gray";

  return currentEditingNote === item.id ? (
    <View
      style={{
        position: "absolute",
        width: "110%",
        height: "150%",
        backgroundColor:
          currentEditingNote === item.id
            ? hexToRGBA(colors[color], 0.12)
            : null,
        borderLeftWidth: 5,
        borderLeftColor:
          currentEditingNote === item.id
            ? colors[item.color || "accent"]
            : "transparent"
      }}
    ></View>
  ) : null;
};
