import React from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../stores/use-theme-store";
import Paragraph from "../ui/typography/paragraph";
import { getStyle } from "./functions";

export const List = ({ items, listType, style = {} }) => {
  const colors = useThemeStore((state) => state.colors);

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingLeft: listType === "ordered" ? 25 : 25,
        ...getStyle(style)
      }}
    >
      {items.map((item, index) => (
        <View
          key={item.text}
          style={{
            paddingVertical: 6,
            flexDirection: "row"
          }}
        >
          {listType === "ordered" ? (
            <Paragraph
              style={{
                marginRight: 5
              }}
            >
              {index + 1}.
            </Paragraph>
          ) : (
            <Icon size={20} name="circle-small" />
          )}
          <Paragraph>{item.text}</Paragraph>
        </View>
      ))}
    </View>
  );
};
