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
import React from "react";
import { HighlightedResult } from "@notesnook/core";
import { View } from "react-native";
import { Pressable } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";
import { useThemeColors } from "@notesnook/theme";
import { DefaultAppStyles } from "../../../utils/styles";
import Heading from "../../ui/typography/heading";
import { AppFontSize } from "../../../utils/size";
import { Properties } from "../../properties";
import { db } from "../../../common/database";
import { eSendEvent } from "../../../services/event-manager";
import { eOnLoadNote } from "../../../utils/events";
import { IconButton } from "../../ui/icon-button";
import { fluidTabsRef } from "../../../utils/global-refs";
type SearchResultProps = {
  item: HighlightedResult;
};

export const SearchResult = (props: SearchResultProps) => {
  const [expanded, setExpanded] = React.useState(true);
  const { colors } = useThemeColors();

  const openNote = async (index?: number) => {
    const note = await db.notes.note(props.item.id);
    eSendEvent(eOnLoadNote, {
      item: {
        ...note,
        content: props.item.rawContent
          ? {
              data: props.item.rawContent || "",
              type: "tiptap"
            }
          : undefined
      },
      searchResultIndex: index
    });
    fluidTabsRef.current?.goToPage("editor");
  };

  return (
    <Pressable
      style={{
        alignSelf: "flex-start",
        alignItems: "flex-start",
        paddingHorizontal: DefaultAppStyles.GAP,
        paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
        borderRadius: 0
      }}
      onLongPress={async () => {
        const note = await db.notes.note(props.item.id);
        Properties.present(note);
      }}
      onPress={async () => openNote()}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: DefaultAppStyles.GAP_SMALL / 2,
            flexShrink: 1
          }}
        >
          {props.item.content?.length ? (
            <IconButton
              name={!expanded ? "chevron-right" : "chevron-down"}
              onPress={() => setExpanded((prev) => !prev)}
              size={AppFontSize.md + 2}
              color={colors.secondary.icon}
              style={{
                width: 23,
                height: 23
              }}
            />
          ) : null}
          <Heading
            size={AppFontSize.sm}
            style={{
              flexShrink: 1
            }}
          >
            {props.item.title.map((title) => (
              <>
                {title.prefix}
                <Heading
                  size={AppFontSize.sm}
                  style={{
                    backgroundColor: colors.secondary.accent,
                    color: colors.secondary.accentForeground
                  }}
                >
                  {title.match}
                </Heading>
                {title.suffix}
              </>
            ))}
          </Heading>
        </View>
        {props.item.content?.length ? (
          <Paragraph size={AppFontSize.xxs} color={colors.secondary.paragraph}>
            {props.item.content.length}
          </Paragraph>
        ) : null}
      </View>

      {expanded &&
        props.item.content.map((content, index) => (
          <Pressable
            key={props.item.id + index}
            style={{
              alignSelf: "flex-start",
              alignItems: "flex-start",
              paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
              borderColor: colors.primary.border,
              borderWidth: 0,
              borderRadius: 0,
              borderBottomWidth: 1,
              borderBottomColor: colors.primary.border,
              width: "100%"
            }}
            onLongPress={async () => {
              const note = await db.notes.note(props.item.id);
              Properties.present(note);
            }}
            onPress={() => {
              let activeIndex = 0;
              for (let i = 0; i <= index; i++) {
                activeIndex += props.item.content[i].length;
              }
              console.log(activeIndex);
              openNote(activeIndex);
            }}
          >
            <Paragraph>
              {content.map((match) => (
                <>
                  {match.prefix}
                  <Paragraph
                    size={AppFontSize.sm}
                    style={{
                      backgroundColor: colors.secondary.accent,
                      color: colors.secondary.accentForeground
                    }}
                  >
                    {match.match}
                  </Paragraph>
                  {match.suffix}
                </>
              ))}
            </Paragraph>
          </Pressable>
        ))}
    </Pressable>
  );
};
