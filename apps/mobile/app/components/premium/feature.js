import React from "react";
import { Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import Paragraph from "../ui/typography/paragraph";
import { ProTag } from "./pro-tag";

export const FeatureBlock = ({
  vertical,
  highlight,
  content,
  icon,
  pro,
  proTagBg
}) => {
  const colors = useThemeStore((state) => state.colors);

  return vertical ? (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        marginBottom: 10
      }}
    >
      <Icon color={colors.accent} name="check" size={SIZE.lg} />

      <Paragraph
        style={{
          flexWrap: "wrap",
          marginLeft: 5,
          flexShrink: 1
        }}
        size={SIZE.md}
      >
        {content}
      </Paragraph>
    </View>
  ) : (
    <View
      style={{
        height: 100,
        justifyContent: "center",
        padding: 10,
        marginRight: 10,
        borderRadius: 5,
        minWidth: 100
      }}
    >
      <Icon color={colors.icon} name={icon} size={SIZE.xl} />
      <Paragraph size={SIZE.md}>
        <Text style={{ color: colors.accent }}>{highlight}</Text>
        {"\n"}
        {content}
      </Paragraph>

      {pro ? (
        <>
          <View style={{ height: 5 }} />
          <ProTag width={50} size={SIZE.xs} background={proTagBg} />
        </>
      ) : (
        <View
          style={{
            width: 30,
            height: 3,
            marginTop: 10,
            borderRadius: 100,
            backgroundColor: colors.accent
          }}
        />
      )}
    </View>
  );
};
