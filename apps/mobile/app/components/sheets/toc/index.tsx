import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { PressableButton } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";
import { SIZE } from "../../../utils/size";
import { presentSheet } from "../../../services/event-manager";
import Heading from "../../ui/typography/heading";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  editorController,
  editorState
} from "../../../screens/editor/tiptap/utils";
import { FlatList } from "react-native-actions-sheet";

type TableOfContentsItem = {
  level: number;
  title: string;
  id: string;
  top: number;
  isFocused?: boolean;
};

interface TableOfContentsProps {
  toc: TableOfContentsItem[];
  close?: (ctx?: string | undefined) => void;
}

const TableOfContentsItem: React.FC<{
  item: TableOfContentsItem;
  close?: (ctx?: string | undefined) => void;
}> = ({ item, close }) => {
  const { colors } = useThemeColors();

  return (
    <PressableButton
      customStyle={{
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "row",
        paddingLeft: item.level * 12,
        height: 45
      }}
      type={item.isFocused ? "selected" : "transparent"}
      onPress={() => {
        editorController.current.commands.scrollIntoViewById(item.id);
        close?.();
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 10
        }}
      >
        <Icon
          name="checkbox-blank-circle"
          size={8}
          allowFontScaling
          color={colors.primary.icon}
        />
        <Paragraph
          color={
            item.isFocused
              ? colors.selected.paragraph
              : colors.primary.paragraph
          }
          size={SIZE.md}
        >
          {item?.title || "New note"}
        </Paragraph>
      </View>
    </PressableButton>
  );
};

const TableOfContents = ({ toc, close }: TableOfContentsProps) => {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        gap: 12,
        paddingTop: 12
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center"
        }}
      >
        <Heading size={SIZE.lg}>Table of contents</Heading>
      </View>

      <FlatList
        data={toc.map((item, index) => {
          return {
            ...item,
            isFocused:
              (editorState().scrollPosition || 0) > item.top &&
              (editorState().scrollPosition || 0) < toc[index + 1]?.top
          };
        })}
        renderItem={({ item }) => (
          <TableOfContentsItem item={item} close={close} />
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

TableOfContents.present = (toc: TableOfContentsItem[]) => {
  presentSheet({
    component: (ref, close, update) => (
      <TableOfContents toc={toc} close={close} />
    )
  });
};

export default TableOfContents;
