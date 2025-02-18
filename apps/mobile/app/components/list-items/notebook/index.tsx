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

import { getFormattedDate } from "@notesnook/common";
import { BaseTrashItem, Notebook, TrashItem } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../../e2e/test.ids";
import { useIsCompactModeEnabled } from "../../../hooks/use-is-compact-mode-enabled";
import { AppFontSize } from "../../../utils/size";
import { Properties } from "../../properties";
import { IconButton } from "../../ui/icon-button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";
import { useSelectionStore } from "../../../stores/use-selection-store";
import useIsSelected from "../../../hooks/use-selected";
import AppIcon from "../../ui/AppIcon";

type NotebookItemProps = {
  item: Notebook | BaseTrashItem<Notebook>;
  totalNotes: number;
  date: number;
  index: number;
  isTrash: boolean;
};

export const NotebookItem = ({
  item,
  isTrash,
  date,
  totalNotes
}: NotebookItemProps) => {
  const { colors } = useThemeColors();
  const compactMode = useIsCompactModeEnabled(
    (item as TrashItem).itemType || item.type
  );
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
            size={AppFontSize.sm}
            numberOfLines={1}
            style={{
              flexWrap: "wrap"
            }}
          >
            {item.title}
          </Paragraph>
        ) : (
          <Heading
            size={AppFontSize.md}
            numberOfLines={1}
            style={{
              flexWrap: "wrap"
            }}
          >
            {item.title}
          </Heading>
        )}

        {!item.description || compactMode ? null : (
          <Paragraph
            size={AppFontSize.sm}
            numberOfLines={2}
            style={{
              flexWrap: "wrap"
            }}
          >
            {item.description}
          </Paragraph>
        )}

        {!compactMode ? (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "center",
              marginTop: 5,
              height: AppFontSize.md + 2
            }}
          >
            {isTrash ? (
              <>
                <Paragraph
                  color={colors.secondary.paragraph}
                  size={AppFontSize.xs}
                  style={{
                    textAlignVertical: "center",
                    marginRight: 6
                  }}
                >
                  {strings.deletedOn(
                    new Date((item as TrashItem).dateDeleted)
                      .toISOString()
                      .slice(0, 10)
                  )}
                </Paragraph>
                <Paragraph
                  color={colors.primary.accent}
                  size={AppFontSize.xs}
                  style={{
                    textAlignVertical: "center",
                    marginRight: 6
                  }}
                >
                  {(item as TrashItem).itemType[0].toUpperCase() +
                    (item as TrashItem).itemType.slice(1)}
                </Paragraph>
              </>
            ) : (
              <Paragraph
                color={colors.secondary.paragraph}
                size={AppFontSize.xs}
                style={{
                  marginRight: 6
                }}
              >
                {getFormattedDate(date, "date")}
              </Paragraph>
            )}
            <Paragraph
              color={colors.secondary.paragraph}
              size={AppFontSize.xs}
              style={{
                marginRight: 6
              }}
            >
              {strings.notes(totalNotes)}
            </Paragraph>

            {item.pinned ? (
              <Icon
                name="pin-outline"
                size={AppFontSize.sm}
                style={{
                  marginRight: 10,
                  marginTop: 2
                }}
                color={colors.primary.accent}
              />
            ) : null}
          </View>
        ) : null}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        {compactMode ? (
          <>
            <Paragraph
              color={colors.primary.icon}
              size={AppFontSize.xs}
              style={{
                marginRight: 6
              }}
            >
              {strings.notes(totalNotes)}
            </Paragraph>
          </>
        ) : null}
        {selectionMode === "notebook" || selectionMode === "trash" ? (
          <>
            <AppIcon
              name={selected ? "checkbox-outline" : "checkbox-blank-outline"}
              color={selected ? colors.selected.icon : colors.primary.icon}
              size={AppFontSize.lg}
            />
          </>
        ) : (
          <IconButton
            color={colors.primary.heading}
            name="dots-horizontal"
            testID={notesnook.ids.notebook.menu}
            size={AppFontSize.xl}
            onPress={() => Properties.present(item)}
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
