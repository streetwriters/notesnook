/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { Pressable } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";
import { AppFontSize } from "../../../utils/size";
import { presentSheet } from "../../../services/event-manager";
import Heading from "../../ui/typography/heading";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  editorController,
  editorState
} from "../../../screens/editor/tiptap/utils";
import { FlatList } from "react-native-actions-sheet";
import { strings } from "@notesnook/intl";

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
    <Pressable
      style={{
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
          size={AppFontSize.md}
        >
          {item?.title || strings.newNote()}
        </Paragraph>
      </View>
    </Pressable>
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
        <Heading size={AppFontSize.lg}>{strings.toc()}</Heading>
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
