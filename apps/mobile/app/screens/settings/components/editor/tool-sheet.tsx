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

import type { ToolId } from "@notesnook/editor";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { useWindowDimensions, View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { Radius, Spacing } from "../../../../common/design/spacing";
import AppIcon from "../../../../components/ui/AppIcon";
import { Button } from "../../../../components/ui/button";
import { Pressable } from "../../../../components/ui/pressable";
import { SvgView } from "../../../../components/ui/svg";
import Heading from "../../../../components/ui/typography/heading";
import Paragraph from "../../../../components/ui/typography/paragraph";
import { presentSheet } from "../../../../services/event-manager";
import { DefaultAppStyles } from "../../../../utils/styles";
import { DraggableItem, useDragState } from "./state";
import {
  findToolById,
  getToolIcon,
  getToolIconName,
  getUngroupedTools
} from "./toolbar-definition";

function ToolSheet({
  group,
  close
}: {
  group: DraggableItem;
  close?: (ctx?: string) => void;
}) {
  const { colors } = useThemeColors();
  const { height } = useWindowDimensions();
  const [data] = useDragState((state) => [state.data]);
  const ungrouped = (getUngroupedTools(data) as ToolId[]).filter(
    (item) => item !== "none"
  );
  const [selected, setSelected] = React.useState<ToolId[]>([]);
  const allSelected =
    ungrouped.length > 0 && selected.length === ungrouped.length;

  const toggle = (item: ToolId) => {
    setSelected((current) =>
      current.includes(item)
        ? current.filter((tool) => tool !== item)
        : [...current, item]
    );
  };

  const toggleSelectAll = () => {
    setSelected(allSelected ? [] : ungrouped.slice());
  };

  const onDone = () => {
    if (selected.length === 0) {
      close?.();
      return;
    }
    const _data = useDragState.getState().data.slice();
    const target =
      group.groupIndex !== undefined
        ? (_data[group.groupIndex][group.index] as ToolId[])
        : (_data[group.index] as ToolId[]);
    // Keep the selection order by unshifting from the end.
    selected
      .slice()
      .reverse()
      .forEach((item) => target.unshift(item));
    useDragState.getState().setData(_data);
    close?.();
  };

  const renderTool = (item: ToolId) => {
    const tool = findToolById(item);
    const isSelected = selected.includes(item);
    const iconName = getToolIconName(item);
    const iconSvgString =
      tool && !iconName
        ? getToolIcon(tool.icon as ToolId, colors.secondary.icon)
        : null;

    return (
      <Pressable
        key={item}
        type="transparent"
        onPress={() => toggle(item)}
        style={{
          width: "100%",
          paddingVertical: Spacing.LEVEL_2,
          borderRadius: Radius.S,
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.LEVEL_1,
          justifyContent: "flex-start"
        }}
      >
        <AppIcon
          name={isSelected ? "checkbox" : "box-empty"}
          iconFamily="notesnook"
          size={16}
          color={
            isSelected
              ? [colors.selected.accent, colors.static.white]
              : colors.secondary.icon
          }
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.LEVEL_0,
            flexShrink: 1
          }}
        >
          {iconName ? (
            <AppIcon
              name={iconName}
              iconFamily="notesnook"
              size={16}
              color={colors.secondary.icon}
            />
          ) : iconSvgString ? (
            <SvgView width={16} height={16} src={iconSvgString} />
          ) : null}
          <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
            {tool?.title}
          </Paragraph>
        </View>
      </Pressable>
    );
  };

  return (
    <View
      style={{
        paddingHorizontal: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_2,
        paddingBottom: Spacing.LEVEL_4,
        gap: Spacing.LEVEL_3
      }}
    >
      <View style={{ gap: Spacing.LEVEL_0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Heading fontSize="XL" lineHeight="100%">
            {strings.addToolsToGroup()}
          </Heading>
          {ungrouped.length > 0 ? (
            <Pressable
              type="transparent"
              onPress={toggleSelectAll}
              style={{
                paddingVertical: Spacing.LEVEL_0,
                width: "auto"
              }}
            >
              <Heading
                fontSize="SM"
                fontFamily="MEDIUM"
                color={colors.primary.accent}
              >
                {allSelected ? strings.deselectAll() : strings.selectAll()}
              </Heading>
            </Pressable>
          ) : null}
        </View>
        <Paragraph fontSize="XS" color={colors.primary.paragraph}>
          {strings.addToolsToGroupDesc()}
        </Paragraph>
      </View>

      <View style={{ height: 1, backgroundColor: colors.primary.border }} />

      {ungrouped.length === 0 ? (
        <Paragraph
          style={{ alignSelf: "center" }}
          color={colors.secondary.paragraph}
        >
          {strings.groupedAllTools()}
        </Paragraph>
      ) : (
        <ScrollView
          nestedScrollEnabled={true}
          style={{ maxHeight: height * 0.6 }}
        >
          {ungrouped.map(renderTool)}
        </ScrollView>
      )}

      <Button
        title={strings.add()}
        type="accent"
        style={{ width: "100%" }}
        onPress={onDone}
      />
    </View>
  );
}

ToolSheet.present = (payload: DraggableItem) => {
  presentSheet({
    component: (_ref, close) => <ToolSheet group={payload} close={close} />
  });
};

export default ToolSheet;
