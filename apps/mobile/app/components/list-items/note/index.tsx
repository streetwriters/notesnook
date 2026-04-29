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
import { useIsCompactModeEnabled } from "../../../hooks/use-is-compact-mode-enabled";
import useNavigationStore, {
  RouteParams
} from "../../../stores/use-navigation-store";
import { useRelationStore } from "../../../stores/use-relation-store";
import { AppFontSize } from "../../../utils/size";

import {
  getFormattedDate,
  NotebooksWithDateEdited,
  TagsWithDateEdited
} from "@notesnook/common";
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
import dayjs from "dayjs";
import { ExpiryDate } from "../../ui/expiry-date";
import { Radius, Spacing } from "../../../common/design/spacing";
import { create } from "zustand";
import { FontFamily } from "../../../common/design/font";

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
  renderedInRoute?: keyof RouteParams;
};

const useShowMoreStore = create<{
  showMoreStatus: Record<string, boolean>;
  show: (id: string) => void;
  hide: (id: string) => void;
}>((set) => ({
  showMoreStatus: {},
  show(id) {
    set((state) => ({
      showMoreStatus: { ...state.showMoreStatus, [id]: true }
    }));
  },
  hide(id) {
    set((state) => ({
      showMoreStatus: { ...state.showMoreStatus, [id]: false }
    }));
  }
}));

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
  noOpen = false,
  renderedInRoute
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
  const showMore = useShowMoreStore((state) => state.showMoreStatus[item.id]);
  const statusIcons = [
    {
      condition: item.conflicted,
      name: "alert-circle",
      color: colors.error.accent
    },
    {
      condition: item.localOnly,
      testID: "sync-off",
      name: "sync-off",
      color: primaryColors.icon
    },
    {
      condition: item.readonly,
      testID: "pencil-lock",
      name: "pencil-lock",
      color: primaryColors.icon
    },
    {
      condition: item.pinned,
      testID: "icon-pinned",
      name: "pin",
      color: primaryColors.icon
    },
    {
      condition: !!locked,
      testID: "lock",
      name: "lock",
      color: primaryColors.icon
    },
    {
      condition: item.favorite,
      testID: "star-filled",
      name: "star-outline",
      color: "orange"
    }
  ];

  return (
    <>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1,
          gap: Spacing.LEVEL_1
        }}
      >
        {compactMode ? null : (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              width: "100%",
              columnGap: Spacing.LEVEL_0,
              rowGap: Spacing.LEVEL_0,
              flexWrap: "wrap"
            }}
          >
            {!isTrash ? (
              <>
                {statusIcons
                  .filter((statusIcon) => statusIcon.condition)
                  .map((statusIcon) => (
                    <View
                      key={statusIcon.testID || statusIcon.name}
                      style={{
                        borderRadius: Radius.XXS,
                        paddingHorizontal: 3,
                        paddingVertical: 3,
                        // borderWidth: 1,
                        // borderColor: primaryColors.border,
                        flexDirection: "row",
                        alignItems: "center"
                      }}
                    >
                      <AppIcon
                        testID={statusIcon.testID}
                        name={statusIcon.name}
                        size={12}
                        iconFamily="notesnook"
                        color={statusIcon.color}
                      />
                    </View>
                  ))}

                {attachmentsCount !== 0 ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      borderRadius: Radius.XXS,
                      paddingHorizontal: 3,
                      paddingVertical: 3,
                      gap: Spacing.LEVEL_0
                    }}
                  >
                    <AppIcon
                      name="link"
                      iconFamily="notesnook"
                      size={AppFontSize.sm}
                      color={primaryColors.icon}
                    />
                    <Paragraph
                      color={colors.secondary.paragraph}
                      size={AppFontSize.xxs}
                    >
                      {attachmentsCount}
                    </Paragraph>
                  </View>
                ) : null}

                {notebooks?.items
                  ?.filter(
                    (item) =>
                      renderedInRoute !== "Notebook" ||
                      item.id !== useNavigationStore.getState().focusedRouteId
                  )
                  .filter((_, index) => showMore || index < 1)
                  .map((item) => (
                    <View
                      key={item.id}
                      style={{
                        borderRadius: 100,
                        paddingHorizontal: Spacing.LEVEL_1,
                        paddingVertical: 2,
                        backgroundColor: colors.secondary.background,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: Spacing.LEVEL_0
                      }}
                    >
                      <AppIcon
                        name="bookmark"
                        iconFamily="notesnook"
                        size={AppFontSize.xs}
                        color={colors.secondary.icon}
                      />
                      <Paragraph
                        fontSize="XS"
                        color={colors.secondary.paragraph}
                      >
                        {item.title}
                      </Paragraph>
                    </View>
                  ))}

                {tags?.items
                  ?.filter((_, index) => showMore || index < 1)
                  .map((item) =>
                    item.id ? (
                      <View
                        key={item.id}
                        style={{
                          borderRadius: 100,
                          paddingHorizontal: Spacing.LEVEL_1,
                          paddingVertical: 2,
                          backgroundColor: colors.secondary.background,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: Spacing.LEVEL_0
                        }}
                      >
                        <Paragraph
                          size={AppFontSize.xs}
                          color={colors.secondary.paragraph}
                        >
                          {item.title}
                        </Paragraph>
                      </View>
                    ) : null
                  )}

                {(() => {
                  const filteredNotebooks = (notebooks?.items || []).filter(
                    (nb) =>
                      renderedInRoute !== "Notebook" ||
                      nb.id !== useNavigationStore.getState().focusedRouteId
                  );
                  const filteredTags = (tags?.items || []).filter((t) => t.id);
                  const totalNotebooks = filteredNotebooks.length;
                  const totalTags = filteredTags.length;
                  const hasMore = totalNotebooks > 1 || totalTags > 1;
                  if (!hasMore) return null;
                  const hiddenCount =
                    (totalNotebooks > 1 ? totalNotebooks - 1 : 0) +
                    (totalTags > 1 ? totalTags - 1 : 0);
                  return (
                    <Heading
                      size={AppFontSize.xs}
                      color={colors.primary.accent}
                      onPress={() => {
                        if (showMore) {
                          useShowMoreStore.getState().hide(item.id);
                        } else {
                          useShowMoreStore.getState().show(item.id);
                        }
                      }}
                    >
                      {showMore
                        ? "Show less"
                        : `+${hiddenCount} ${strings.more()}`}
                    </Heading>
                  );
                })()}
              </>
            ) : (
              <>
                <Paragraph
                  color={colors.secondary.paragraph}
                  size={AppFontSize.xxs}
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
                  size={AppFontSize.xxs}
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

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.LEVEL_1
          }}
        >
          {color ? (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 100,
                backgroundColor: color?.colorCode
              }}
            />
          ) : null}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              flexGrow: 1,
              alignItems: "center"
            }}
          >
            <Heading
              numberOfLines={1}
              color={primaryColors.heading}
              size={AppFontSize.sm}
              style={{
                flexShrink: 1
              }}
            >
              {item.title}
            </Heading>

            <IconButton
              testID={notesnook.listitem.menu}
              color={colors.secondary.icon}
              name="dots-three"
              iconFamily="notesnook"
              size={20}
              onPress={() => !noOpen && Properties.present(item)}
              style={{
                justifyContent: "center",
                height: undefined,
                width: undefined,
                borderRadius: 100,
                alignItems: "center"
              }}
            />
          </View>
        </View>

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

        <View
          style={{
            flexDirection: "row",
            gap: Spacing.LEVEL_1
          }}
        >
          {compactMode ? null : (
            <View
              style={{
                gap: Spacing.LEVEL_0,
                flexDirection: "row"
              }}
            >
              <AppIcon size={13} name="calendar" iconFamily="notesnook" />
              <Paragraph
                style={{
                  fontSize: AppFontSize.xs,
                  color: colors.secondary.paragraph
                }}
              >
                {getFormattedDate(
                  date,
                  dayjs(date).isBefore(dayjs().subtract(1, "day").hour(23))
                    ? "date"
                    : "time"
                )}
              </Paragraph>
            </View>
          )}

          {item.expiryDate?.value ? (
            <ExpiryDate
              note={item as Note}
              color={color?.colorCode}
              textStyle={{ fontSize: AppFontSize.xxs }}
              short
              iconSize={AppFontSize.xxs}
              style={{
                justifyContent: "flex-start",
                paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL / 2,
                alignSelf: "flex-start"
              }}
            />
          ) : null}

          {reminder ? (
            <ReminderTime
              reminder={reminder}
              color={color?.colorCode}
              textStyle={{
                fontSize: AppFontSize.xs,
                fontFamily: FontFamily.REGULAR
              }}
              short
              iconSize={AppFontSize.xxs}
              style={{
                justifyContent: "flex-start",
                paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL / 2,
                alignSelf: "flex-start",
                backgroundColor: colors.primary.shade
              }}
            />
          ) : null}
        </View>
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
              <AppIcon
                name="alert-circle"
                style={{
                  marginRight: 6
                }}
                size={AppFontSize.sm}
                color={colors.error.accent}
              />
            ) : null}

            {locked ? (
              <AppIcon
                name="lock"
                testID="note-locked-icon"
                size={AppFontSize.sm}
                style={{
                  marginRight: 6
                }}
                color={primaryColors.icon}
              />
            ) : null}

            {item.favorite ? (
              <AppIcon
                testID="icon-star"
                name="star-outline"
                size={AppFontSize.sm}
                style={{
                  marginRight: 6
                }}
                color={colors.static.orange}
              />
            ) : null}

            <TimeSince
              style={{
                fontSize: AppFontSize.xxs,
                color: colors.secondary.paragraph,
                marginRight: 6
              }}
              time={date}
              updateFrequency={Date.now() - date < 60000 ? 2000 : 60000}
            />
          </>
        ) : null}

        {selectionMode === "note" || selectionMode === "trash" ? (
          <>
            <View
              style={{
                height: 35,
                width: 35,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <AppIcon
                name={selected ? "checkbox-outline" : "checkbox-blank-outline"}
                color={selected ? colors.selected.icon : colors.primary.icon}
                size={AppFontSize.lg}
              />
            </View>
          </>
        ) : null}
      </View>
    </>
  );
};

export default NoteItem;
