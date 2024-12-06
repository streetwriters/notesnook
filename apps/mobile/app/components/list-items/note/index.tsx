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
import { useIsCompactModeEnabled } from "../../../hooks/use-is-compact-mode-enabled";
import useNavigationStore from "../../../stores/use-navigation-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { SIZE } from "../../../utils/size";

import { NotebooksWithDateEdited, TagsWithDateEdited } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { notesnook } from "../../../../e2e/test.ids";
import useIsSelected from "../../../hooks/use-selected";
import { useTabStore } from "../../../screens/editor/tiptap/use-tab-store";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { DefaultAppStyles } from "../../../utils/styles";
import { Properties } from "../../properties";
import AppIcon from "../../ui/AppIcon";
import { IconButton } from "../../ui/icon-button";
import { ReminderTime } from "../../ui/reminder-time";
import { TimeSince } from "../../ui/time-since";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

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
  const selectionMode = useSelectionStore((state) => state.selectionMode);
  const [selected] = useIsSelected(item);

  return (
    <>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1
        }}
      >
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
            size={SIZE.sm}
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
              columnGap: 8,
              rowGap: 4,
              flexWrap: "wrap"
            }}
          >
            {!isTrash ? (
              <>
                {item.conflicted ? (
                  <Icon
                    name="alert-circle"
                    size={SIZE.sm}
                    color={colors.error.accent}
                  />
                ) : null}

                {item.localOnly ? (
                  <Icon
                    testID="sync-off"
                    name="sync-off"
                    size={SIZE.sm}
                    color={primaryColors.icon}
                  />
                ) : null}

                {item.readonly ? (
                  <Icon
                    testID="pencil-lock"
                    name="pencil-lock"
                    size={SIZE.sm}
                    color={primaryColors.icon}
                  />
                ) : null}

                <TimeSince
                  style={{
                    fontSize: SIZE.xxs,
                    color: colors.secondary.paragraph
                  }}
                  time={date}
                  updateFrequency={Date.now() - date < 60000 ? 2000 : 60000}
                />

                {attachmentsCount > 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
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
                      size={SIZE.xxs}
                    >
                      {attachmentsCount}
                    </Paragraph>
                  </View>
                ) : null}

                {item.pinned ? (
                  <Icon
                    testID="icon-pinned"
                    name="pin-outline"
                    size={SIZE.xs}
                    color={color?.colorCode || primaryColors.accent}
                  />
                ) : null}

                {locked ? (
                  <Icon
                    name="lock"
                    testID="note-locked-icon"
                    size={SIZE.sm}
                    color={primaryColors.icon}
                  />
                ) : null}

                {item.favorite ? (
                  <Icon
                    testID="icon-star"
                    name="star-outline"
                    size={SIZE.sm}
                    color="orange"
                  />
                ) : null}

                {reminder ? (
                  <ReminderTime
                    reminder={reminder}
                    disabled
                    color={color?.colorCode}
                    textStyle={{
                      fontSize: SIZE.xxxs
                    }}
                    iconSize={SIZE.xxxs}
                    style={{
                      height: "auto"
                    }}
                  />
                ) : null}

                {notebooks?.items
                  ?.filter(
                    (item) =>
                      item.id !== useNavigationStore.getState().focusedRouteId
                  )
                  .map((item) => (
                    <View
                      key={item.id}
                      style={{
                        borderRadius: 4,
                        backgroundColor: colors.secondary.background,
                        paddingHorizontal: 4,
                        borderWidth: 0.5,
                        borderColor: primaryColors.border,
                        paddingVertical: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: DefaultAppStyles.GAP_SMALL / 2
                      }}
                    >
                      <AppIcon
                        name="book-outline"
                        size={SIZE.xxxs}
                        color={colors.secondary.icon}
                      />
                      <Paragraph
                        size={SIZE.xxxs}
                        color={colors.secondary.paragraph}
                      >
                        {item.title}
                      </Paragraph>
                    </View>
                  ))}

                {!isTrash && !compactMode && tags
                  ? tags.items?.map((item) =>
                      item.id ? (
                        <View
                          key={item.id}
                          style={{
                            borderRadius: 4,
                            backgroundColor: colors.secondary.background,
                            paddingHorizontal: 4,
                            borderWidth: 0.5,
                            borderColor: primaryColors.border,
                            paddingVertical: 1
                          }}
                        >
                          <Paragraph
                            size={SIZE.xxxs}
                            color={colors.secondary.paragraph}
                          >
                            #{item.title}
                          </Paragraph>
                        </View>
                      ) : null
                    )
                  : null}
              </>
            ) : (
              <>
                <Paragraph
                  color={colors.secondary.paragraph}
                  size={SIZE.xxs}
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
                  size={SIZE.xxs}
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
                fontSize: SIZE.xxs,
                color: colors.secondary.paragraph,
                marginRight: 6
              }}
              time={date}
              updateFrequency={Date.now() - date < 60000 ? 2000 : 60000}
            />
          </>
        ) : null}

        {selectionMode ? (
          <>
            <AppIcon
              name={selected ? "checkbox-outline" : "checkbox-blank-outline"}
              color={selected ? colors.selected.icon : colors.primary.icon}
              size={SIZE.lg}
            />
          </>
        ) : (
          <IconButton
            testID={notesnook.listitem.menu}
            color={colors.secondary.icon}
            name="dots-horizontal"
            size={SIZE.lg}
            onPress={() => !noOpen && Properties.present(item)}
            style={{
              justifyContent: "center",
              height: 35,
              width: 35,
              borderRadius: 100,
              alignItems: "center"
            }}
          />
        )}
      </View>
    </>
  );
};

export default NoteItem;
