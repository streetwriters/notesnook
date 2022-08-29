import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";

export const SelectionIcon = ({ setActionStrip, item, compactMode }) => {
  const colors = useThemeStore((state) => state.colors);

  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const selectedItemsList = useSelectionStore(
    (state) => state.selectedItemsList
  );
  const setSelectedItem = useSelectionStore((state) => state.setSelectedItem);
  const [selected, setSelected] = useState(false);

  useEffect(() => {
    if (selectionMode) {
      setActionStrip(false);
      let exists = selectedItemsList.filter(
        (o) => o.dateCreated === item.dateCreated
      );

      if (exists[0]) {
        if (!selected) {
          setSelected(true);
        }
      } else {
        if (selected) {
          setSelected(false);
        }
      }
    }
  }, [selectedItemsList, item.id]);

  const onPress = () => {
    setSelectedItem(item);
  };

  return selectionMode ? (
    <View
      style={{
        display: "flex",
        opacity: 1,
        width: "10%",
        height: compactMode ? 40 : 70,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
        borderRadius: 5,
        marginRight: 10,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        style={{
          justifyContent: "center",
          alignItems: "center",
          height: 70
        }}
      >
        {selected && (
          <Icon
            size={SIZE.xl}
            color={selected ? colors.accent : colors.icon}
            name="check"
          />
        )}
      </TouchableOpacity>
    </View>
  ) : null;
};
