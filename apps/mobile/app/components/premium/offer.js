import React from "react";
import { Text } from "react-native";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import Paragraph from "../ui/typography/paragraph";

export const Offer = ({
  off = "30",
  text = "on yearly plan, offer ends soon",
  padding = 0
}) => {
  const colors = useThemeStore((state) => state.colors);

  return (
    <Paragraph
      style={{
        textAlign: "center",
        paddingVertical: padding
      }}
      size={SIZE.xxxl}
    >
      GET {off}
      <Text style={{ color: colors.accent }}>%</Text> OFF!{"\n"}
      <Paragraph color={colors.icon}>{text}</Paragraph>
    </Paragraph>
  );
};
