import React from "react";
import { View } from "react-native";
import { useMessageStore } from "../../stores/use-message-store";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import { getStyle } from "./functions";

export const Title = ({ text, style = {}, inline }) => {
  const announcements = useMessageStore((state) => state.announcements);
  let announcement = announcements.length > 0 ? announcements[0] : null;
  const remove = useMessageStore((state) => state.remove);

  return inline ? (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: inline ? 5 : 0
      }}
    >
      <Heading
        style={{
          marginHorizontal: 12,
          marginTop: 12,
          ...getStyle(style),
          textAlign: inline ? "left" : style?.textAlign,
          flexShrink: 1
        }}
        numberOfLines={1}
        size={inline ? SIZE.md : SIZE.xl}
      >
        {inline ? text?.toUpperCase() : text}
      </Heading>

      <Button
        type="gray"
        icon="close"
        height={null}
        onPress={() => {
          remove(announcement.id);
        }}
        hitSlop={{
          left: 15,
          top: 10,
          bottom: 10,
          right: 0
        }}
        iconSize={24}
        fontSize={SIZE.xs + 1}
        style={{
          borderRadius: 100,
          paddingVertical: 0,
          paddingHorizontal: 0,
          marginRight: 12,
          zIndex: 10
        }}
      />
    </View>
  ) : (
    <Heading
      style={{
        marginHorizontal: 12,
        ...getStyle(style),
        marginTop: style?.marginTop || 12
      }}
    >
      {text}
    </Heading>
  );
};
