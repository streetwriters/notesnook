import React from "react";
import { View } from "react-native";
import { DDS } from "../../services/device-detection";
import { useThemeStore } from "../../stores/use-theme-store";
import { getElevation } from "../../utils";

const DialogContainer = ({ width, height, ...restProps }) => {
  const colors = useThemeStore((state) => state.colors);

  return (
    <View
      {...restProps}
      style={{
        ...getElevation(5),
        width: width || DDS.isTab ? 500 : "85%",
        maxHeight: height || 450,
        borderRadius: 10,
        backgroundColor: colors.bg,
        paddingTop: 12
      }}
    />
  );
};

export default DialogContainer;
