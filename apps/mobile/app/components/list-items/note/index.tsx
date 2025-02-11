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

import {
  BaseTrashItem,
  Color,
  Note,
  Reminder,
  TrashItem
} from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import { EntityLevel, decode } from "entities";
import React from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../../e2e/test.ids";
import { useIsCompactModeEnabled } from "../../../hooks/use-is-compact-mode-enabled";
import NotebookScreen from "../../../screens/notebook";
import { TaggedNotes } from "../../../screens/notes/tagged";
import useNavigationStore from "../../../stores/use-navigation-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { SIZE } from "../../../utils/size";

import { useTabStore } from "../../../screens/editor/tiptap/use-tab-store";
import { NotebooksWithDateEdited, TagsWithDateEdited } from "@notesnook/common";
import { Properties } from "../../properties";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { ReminderTime } from "../../ui/reminder-time";
import { TimeSince } from "../../ui/time-since";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";

type NoteItemProps = {
  item: Note | BaseTrashItem<Note>;
  index: number;
  tags?: TagsWithDateEdited;
  notebooks?: NotebooksWithDateEdited;
  color?: Color;
  reminder?: Reminder;
  attachmentsCount: number;
  date: number;
  isTrash?: boolean;
  noOpen?: boolean;
  locked?: boolean;
};

const NoteItem = ({
  item,
  isTrash,
  date,
  color,
  notebooks,
  reminder,
  tags,
  attachmentsCount,
  locked,
  noOpen = false
}: NoteItemProps) => {
  const isEditingNote = useTabStore(
    (state) =>
      state.tabs.find((t) => t.id === state.currentTab)?.session?.noteId ===
      item.id
  );
  const { colors } = useThemeColors();
  const compactMode = useIsCompactModeEnabled(
    (item as TrashItem).itemType || item.type
  );
  const _update = useRelationStore((state) => state.updater);
  const primaryColors = isEditingNote ? colors.selected : colors.primary;

  return (
    <>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1
        }}
      >
        {!compactMode ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              zIndex: 10,
              elevation: 10,
              marginBottom: 2.5,
              flexWrap: "wrap"
            }}
          >
            {notebooks?.items
              ?.filter(
                (item) =>
                  item.id !== useNavigationStore.getState().focusedRouteId
              )
              .map((item) => (
                <Button
                  title={
                    item.title.length > 25
                      ? item.title.slice(0, 25) + "..."
                      : item.title
                  }
                  tooltipText={item.title}
                  key={item.id}
                  height={25}
                  icon="book-outline"
                  type="secondary"
                  fontSize={SIZE.xs}
                  iconSize={SIZE.sm}
                  textStyle={{
                    marginRight: 0
                  }}
                  style={{
                    borderRadius: 5,
                    marginRight: 5,
                    paddingHorizontal: 6,
                    marginBottom: 5
                  }}
                  onPress={() => {
                    NotebookScreen.navigate(item, true);
                  }}
                />
              ))}

            <ReminderTime
              reminder={reminder}
              color={color?.colorCode}
              onPress={() => {
                Properties.present(reminder);
              }}
              style={{
                height: 25
              }}
            />
          </View>
        ) : null}

        {compactMode ? (
          <Paragraph
            numberOfLines={1}
            color={color?.colorCode || primaryColors.heading}
            size={SIZE.sm}
            style={{
              paddingRight: 10
            }}
          >
            {item.title}
          </Paragraph>
        ) : (
          <Heading
            numberOfLines={1}
            color={color?.colorCode || primaryColors.heading}
            size={SIZE.md}
            style={{
              paddingRight: 10
            }}
          >
            {item.title}
          </Heading>
        )}

        {item.headline && !compactMode ? (
          <Paragraph
            style={{
              flexWrap: "wrap"
            }}
            color={primaryColors.paragraph}
            numberOfLines={2}
          >
            {decode(item.headline, {
              level: EntityLevel.HTML
            })}
          </Paragraph>
        ) : null}

        {compactMode ? null : (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "100%",
              marginTop: 5,
              height: SIZE.md + 2
            }}
          >
            {!isTrash ? (
              <>
                {item.conflicted ? (
                  <Icon
                    name="alert-circle"
                    style={{
                      marginRight: 6
                    }}
                    size={SIZE.sm}
                    color={colors.error.accent}
                  />
                ) : null}

                {item.localOnly ? (
                  <Icon
                    testID="sync-off"
                    name="sync-off"
                    size={SIZE.sm}
                    style={{
                      marginRight: 6
                    }}
                    color={primaryColors.icon}
                  />
                ) : null}

                {item.readonly ? (
                  <Icon
                    testID="pencil-lock"
                    name="pencil-lock"
                    size={SIZE.sm}
                    style={{
                      marginRight: 6
                    }}
                    color={primaryColors.icon}
                  />
                ) : null}

                <TimeSince
                  style={{
                    fontSize: SIZE.xs,
                    color: colors.secondary.paragraph,
                    marginRight: 6
                  }}
                  time={date}
                  updateFrequency={Date.now() - date < 60000 ? 2000 : 60000}
                />

                {attachmentsCount > 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginRight: 6,
                      gap: 2
                    }}
                  >
                    <Icon
                      name="attachment"
                      size={SIZE.sm}
                      color={primaryColors.icon}
                    />
                    <Paragraph
                      color={colors.secondary.paragraph}
                      size={SIZE.xs}
                    >
                      {attachmentsCount}
                    </Paragraph>
                  </View>
                ) : null}

                {item.pinned ? (
                  <Icon
                    testID="icon-pinned"
                    name="pin-outline"
                    size={SIZE.sm}
                    style={{
                      marginRight: 6
                    }}
                    color={color?.colorCode || primaryColors.accent}
                  />
                ) : null}

                {locked ? (
                  <Icon
                    name="lock"
                    testID="note-locked-icon"
                    size={SIZE.sm}
                    style={{
                      marginRight: 6
                    }}
                    color={primaryColors.icon}
                  />
                ) : null}

                {item.favorite ? (
                  <Icon
                    testID="icon-star"
                    name="star-outline"
                    size={SIZE.sm}
                    style={{
                      marginRight: 6
                    }}
                    color="orange"
                  />
                ) : null}

                {!isTrash && !compactMode && tags
                  ? tags.items?.map((item) =>
                      item.id ? (
                        <Button
                          title={"#" + item.title}
                          key={item.id}
                          height={23}
                          type="plain"
                          textStyle={{
                            textDecorationLine: "underline",
                            color: colors.secondary.paragraph
                          }}
                          hitSlop={{ top: 8, bottom: 12, left: 0, right: 0 }}
                          fontSize={SIZE.xs}
                          style={{
                            borderRadius: 5,
                            paddingHorizontal: 6,
                            marginRight: 4,
                            zIndex: 10,
                            maxWidth: tags.items?.length > 1 ? 130 : null
                          }}
                          onPress={() => TaggedNotes.navigate(item, true)}
                        />
                      ) : null
                    )
                  : null}
              </>
            ) : (
              <>
                <Paragraph
                  color={colors.secondary.paragraph}
                  size={SIZE.xs}
                  style={{
                    marginRight: 6
                  }}
                >
                  {item && item.dateDeleted
                    ? strings.deletedOn(
                        new Date(item.dateDeleted).toISOString().slice(0, 10)
                      )
                    : null}
                </Paragraph>

                <Paragraph
                  color={primaryColors.accent}
                  size={SIZE.xs}
                  style={{
                    marginRight: 6
                  }}
                >
                  {strings.note()}
                </Paragraph>
              </>
            )}
          </View>
        )}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        {compactMode ? (
          <>
            {item.conflicted ? (
              <Icon
                name="alert-circle"
                style={{
                  marginRight: 6
                }}
                size={SIZE.sm}
                color={colors.error.accent}
              />
            ) : null}

            {locked ? (
              <Icon
                name="lock"
                testID="note-locked-icon"
                size={SIZE.sm}
                style={{
                  marginRight: 6
                }}
                color={colors.secondary.background}
              />
            ) : null}

            {item.favorite ? (
              <Icon
                testID="icon-star"
                name="star-outline"
                size={SIZE.sm}
                style={{
                  marginRight: 6
                }}
                color="orange"
              />
            ) : null}

            <TimeSince
              style={{
                fontSize: SIZE.xs,
                color: colors.secondary.paragraph,
                marginRight: 6
              }}
              time={date}
              updateFrequency={Date.now() - date < 60000 ? 2000 : 60000}
            />
          </>
        ) : null}

        <IconButton
          testID={notesnook.listitem.menu}
          color={primaryColors.paragraph}
          name="dots-horizontal"
          size={SIZE.xl}
          onPress={() => !noOpen && Properties.present(item)}
          style={{
            justifyContent: "center",
            height: 35,
            width: 35,
            borderRadius: 100,
            alignItems: "center"
          }}
        />
      </View>
    </>
  );
};

export default NoteItem;
