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
import * as React from "react";
import { View } from "react-native";
import { DraxDragWithReceiverEventData, DraxView } from "react-native-drax";
import Animated, { Layout } from "react-native-reanimated";
import { presentDialog } from "../../../../components/dialog/functions";
import AppIcon from "../../../../components/ui/AppIcon";
import { IconButton } from "../../../../components/ui/icon-button";
import { SvgView } from "../../../../components/ui/svg";
import Heading from "../../../../components/ui/typography/heading";
import Paragraph from "../../../../components/ui/typography/paragraph";
import { Radius, Spacing } from "../../../../common/design/spacing";
import { getElevationStyle } from "../../../../utils/elevation";
import { renderGroup } from "./common";
import { DraggableItem, ToolDefinition, useDragState } from "./state";
import ToolSheet from "./tool-sheet";
import {
  findToolById,
  getToolIcon,
  getToolIconName
} from "./toolbar-definition";

import { isFeatureAvailable, useIsFeatureAvailable } from "@notesnook/common";
import type { ToolId } from "@notesnook/editor";
import { strings } from "@notesnook/intl";
import { ToastManager } from "../../../../services/event-manager";
import { DefaultAppStyles } from "../../../../utils/styles";

export const Tool = ({
  item,
  index,
  groupIndex,
  parentIndex
}: DraggableItem) => {
  const setData = useDragState((state) => state.setData);
  const [dragged, setDragged] = useDragState((state) => [
    state.dragged,
    state.setDragged
  ]);
  const [_recieving, setRecieving] = React.useState(false);
  const [recievePosition, setRecievePosition] = React.useState("above");
  const { colors } = useThemeColors();
  const isSubgroup = typeof item === "object";
  const isDragged = !dragged
    ? false
    : dragged.item &&
      ((dragged.type === "tool" && dragged.item === item) ||
        (isSubgroup && dragged.item?.[0] === item?.[0]));

  const dimensions = React.useRef({
    height: 0,
    width: 0
  });
  const tool =
    isSubgroup || item === "dummy" ? null : findToolById(item as ToolId);
  const iconSvgString =
    isSubgroup || !tool
      ? null
      : getToolIcon(tool.icon as ToolId, colors.secondary.icon);
  // Prefer a glyph from the custom `notesnook` icon font when the tool has one;
  // otherwise fall back to the editor's built-in per-tool icon (`iconSvgString`).
  const toolIconName =
    isSubgroup || !tool ? undefined : getToolIconName(item as ToolId);
  const featureAvailable = useIsFeatureAvailable("customToolbarPreset");

  const buttons = React.useCallback(() => {
    const btns: {
      name: string;
      iconFamily?: "notesnook" | "material" | "evilicons";
      color?: string;
      onPress: () => void;
    }[] = isSubgroup
      ? [
          {
            name: "trash",
            iconFamily: "notesnook",
            color: colors.error.icon,
            onPress: async () => {
              const feature = await isFeatureAvailable("customToolbarPreset");
              if (!feature.isAllowed) {
                ToastManager.show({
                  type: "info",
                  message: feature?.error
                });
                return;
              }
              presentDialog({
                context: "global",
                title: strings.deleteCollapsed(),
                positiveText: strings.delete(),
                paragraph: strings.deleteCollapsedDesc(),
                positivePress: async () => {
                  if (typeof groupIndex !== "number") return;
                  const _data = useDragState.getState().data.slice();
                  _data[groupIndex].splice(index, 1);
                  setData(_data);
                }
              });
            }
          },
          {
            name: "plus",
            iconFamily: "notesnook",
            color: colors.primary.icon,
            onPress: async () => {
              const feature = await isFeatureAvailable("customToolbarPreset");
              if (!feature.isAllowed) {
                ToastManager.show({
                  type: "info",
                  message: feature?.error
                });
                return;
              }
              ToolSheet.present({
                item,
                index,
                groupIndex,
                parentIndex
              });
            }
          }
        ]
      : [
          {
            name: "minus",
            iconFamily: "notesnook",
            color: colors.primary.icon,
            onPress: async () => {
              const feature = await isFeatureAvailable("customToolbarPreset");
              if (!feature.isAllowed) {
                ToastManager.show({
                  type: "info",
                  message: feature?.error
                });
                return;
              }
              if (typeof groupIndex !== "number") return;
              const _data = useDragState.getState().data.slice();
              if (typeof parentIndex !== "number") {
                const index = _data[groupIndex]?.findIndex(
                  (tool: any) => tool === item
                );
                _data[groupIndex]?.splice(index, 1);
              } else {
                const index = (
                  _data[parentIndex][groupIndex] as ToolId[]
                )?.findIndex((tool: string) => tool === item);
                (_data[parentIndex][groupIndex] as ToolId[]).splice(index, 1);
              }
              setData(_data);
            }
          }
        ];

    if (!isSubgroup && parentIndex === undefined) {
      // Top-level tool: collapse it into this group's collapsed subgroup.
      btns.unshift({
        name: "format-arrows-in-simple",
        iconFamily: "notesnook",
        color: colors.primary.icon,
        onPress: async () => {
          if (groupIndex === undefined) return;
          const _data = useDragState.getState().data.slice();
          const hasSubGroup = Array.isArray(
            _data[groupIndex][_data[groupIndex].length - 1]
          );
          const _item = _data[groupIndex]?.splice(index, 1)[0];
          if (hasSubGroup) {
            const subgroup = _data[groupIndex][
              _data[groupIndex].length - 1
            ] as ToolId[];
            subgroup.unshift(_item as ToolId);
          } else {
            _data[groupIndex]?.push([]);
            (
              _data[groupIndex][_data[groupIndex].length - 1] as ToolId[]
            ).unshift(_item as ToolId);
          }

          setData(_data);
        }
      });
    } else if (!isSubgroup && typeof parentIndex === "number") {
      // Tool inside a collapsed subgroup: expand it back out to the parent group.
      btns.unshift({
        name: "format-arrows-out-simple",
        iconFamily: "notesnook",
        color: colors.primary.icon,
        onPress: async () => {
          const feature = await isFeatureAvailable("customToolbarPreset");
          if (!feature.isAllowed) {
            ToastManager.show({
              type: "info",
              message: feature?.error
            });
            return;
          }
          if (typeof groupIndex !== "number") return;
          const _data = useDragState.getState().data.slice();
          const parentGroup = _data[parentIndex] as ToolDefinition[];
          const subgroup = parentGroup[groupIndex] as ToolId[];
          if (!Array.isArray(subgroup)) return;
          const idx = subgroup.findIndex((tool) => tool === item);
          if (idx === -1) return;
          const [removed] = subgroup.splice(idx, 1);
          // Re-insert the tool into the parent group, just before the subgroup.
          parentGroup.splice(groupIndex, 0, removed);
          // Drop the subgroup if it is now empty.
          if (subgroup.length === 0) parentGroup.splice(groupIndex + 1, 1);
          setData(_data);
        }
      });
    }
    return btns;
  }, [
    colors.error.icon,
    colors.primary.icon,
    groupIndex,
    index,
    isSubgroup,
    item,
    parentIndex,
    setData
  ]);

  const renderChild = React.useCallback(
    (hover?: boolean) => (
      <>
        <View
          onLayout={(event) => {
            if (hover) return;
            if (!isDragged) dimensions.current = event.nativeEvent.layout;
          }}
          style={{
            backgroundColor: isSubgroup
              ? "transparent"
              : colors.secondary.background,
            marginBottom: DefaultAppStyles.GAP_SMALL,
            width: isDragged ? dimensions.current.width : "100%",
            height: isSubgroup ? 40 : undefined,
            padding: isSubgroup ? 0 : Spacing.LEVEL_2,
            borderRadius: Radius.S,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            ...getElevationStyle(hover ? 3 : 0)
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.LEVEL_0,
              paddingLeft: isSubgroup ? Spacing.LEVEL_3 : 0
            }}
          >
            {isSubgroup ? (
              <AppIcon
                name="dots-six-vertical"
                iconFamily="notesnook"
                size={16}
                color={colors.secondary.icon}
              />
            ) : toolIconName ? (
              <AppIcon
                name={toolIconName}
                iconFamily="notesnook"
                size={16}
                color={colors.secondary.icon}
              />
            ) : iconSvgString ? (
              <SvgView width={16} height={16} src={iconSvgString} />
            ) : null}
            {isSubgroup ? (
              <Heading
                fontSize="SM"
                fontFamily="MEDIUM"
                lineHeight={null}
                color={colors.secondary.heading}
              >
                {strings.collapsed()}
              </Heading>
            ) : (
              <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
                {tool?.title}
              </Paragraph>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: DefaultAppStyles.GAP_SMALL
            }}
          >
            {buttons().map((btn) => (
              <IconButton
                top={0}
                left={0}
                bottom={0}
                right={0}
                key={item + btn.name}
                onPress={btn.onPress}
                name={btn.name}
                iconFamily={btn.iconFamily}
                color={btn.color}
                size={isSubgroup ? 16 : 14}
              />
            ))}
          </View>
        </View>

        {isSubgroup && !isDragged ? (
          <View
            style={{
              paddingLeft: Spacing.LEVEL_3
            }}
            key={`subgroup-${item.length}-${groupIndex}-${index}-${parentIndex}`}
          >
            {renderGroup({ index, item, parentIndex: groupIndex })}
          </View>
        ) : null}
      </>
    ),
    [
      buttons,
      colors.secondary.background,
      colors.secondary.heading,
      colors.secondary.icon,
      colors.secondary.paragraph,
      groupIndex,
      iconSvgString,
      toolIconName,
      index,
      isDragged,
      isSubgroup,
      item,
      parentIndex,
      tool?.title
    ]
  );

  const onDrop = React.useCallback(
    (data: DraxDragWithReceiverEventData) => {
      if (!featureAvailable?.isAllowed) {
        ToastManager.show({
          type: "info",
          message: featureAvailable?.error || strings.featureNotAvailable()
        });
        return;
      }
      const isDroppedAbove = data.receiver.receiveOffsetRatio.y < 0.5;
      const dragged = data.dragged.payload;
      const reciever = data.receiver.payload;
      const _data = useDragState.getState().data?.slice();
      if (!_data) return;
      const isFromSubgroup = typeof dragged?.parentIndex === "number";
      const isDroppedAtSubgroup = typeof reciever?.parentIndex === "number";

      if (dragged.type === "tool") {
        const fromIndex = dragged.index;
        const toIndex = isDroppedAbove
          ? Math.max(0, reciever.index)
          : reciever.index + 1;

        const insertAt = isDroppedAtSubgroup
          ? (_data[reciever.parentIndex][reciever.groupIndex] as string[])
          : (_data[reciever.groupIndex] as string[]);
        const insertFrom = isFromSubgroup
          ? (_data[dragged.parentIndex][dragged.groupIndex] as string[])
          : (_data[dragged.groupIndex] as string[]);
        insertAt.splice(
          toIndex > fromIndex ? toIndex - 1 : toIndex,
          0,
          insertFrom.splice(fromIndex, 1)[0]
        );

        // Remove the group or subgroup if it is empty.
        if (insertFrom.length === 0) {
          isFromSubgroup
            ? _data[dragged.parentIndex].splice(
                _data[dragged.parentIndex].length - 1,
                1
              )
            : _data.splice(dragged.groupIndex, 1);
        }
      }
      setData(_data);
      setRecieving(false);
      return data.dragAbsolutePosition;
    },
    [featureAvailable]
  );

  const onRecieveData = React.useCallback(
    (data: DraxDragWithReceiverEventData) => {
      setRecieving(true);
      if (data.receiver.receiveOffsetRatio.y < 0.5) {
        setRecievePosition("above");
      } else {
        setRecievePosition("below");
      }
    },
    []
  );

  return (
    <Animated.View layout={Layout}>
      <DraxView
        payload={{
          item,
          index,
          groupIndex,
          type: isSubgroup ? "subgroup" : "tool",
          parentIndex
        }}
        receptive={
          dragged?.type === "group" ||
          (dragged?.type !== "tool" && isSubgroup) ||
          (dragged?.type === "tool" && isSubgroup) ||
          (!isSubgroup && dragged?.type === "subgroup") ||
          (dragged?.item && dragged.item.indexOf(item as string) > -1)
            ? false
            : true
        }
        longPressDelay={500}
        onDragStart={() => {
          setDragged({
            item,
            type: isSubgroup ? "subgroup" : "tool",
            ...dimensions.current,
            groupIndex: groupIndex
          });
        }}
        receivingStyle={{
          paddingBottom: recievePosition === "below" ? 50 : 0,
          paddingTop: recievePosition === "above" ? 50 : 0,
          backgroundColor:
            dragged?.type === "subgroup"
              ? colors.secondary.background
              : undefined,
          marginTop: recievePosition === "above" ? Spacing.LEVEL_3 : 0,
          marginBottom: recievePosition === "below" ? Spacing.LEVEL_3 : 0,
          borderRadius: 10
        }}
        renderHoverContent={() => renderChild(true)}
        hoverStyle={{
          height: "auto"
        }}
        draggable={item !== "dummy"}
        onDragDrop={() => {
          setDragged({});
        }}
        onDragEnd={() => {
          setDragged({});
        }}
        hoverDragReleasedStyle={{
          opacity: 0
        }}
        onReceiveDragDrop={onDrop}
        onReceiveDragOver={onRecieveData}
        onReceiveDragExit={() => {
          setRecieving(false);
        }}
        onReceiveDragEnter={onRecieveData}
      >
        {isDragged || item === "dummy" ? (
          <View
            style={{
              width: "100%",
              height: item === "dummy" ? 10 : 0
            }}
          />
        ) : (
          renderChild()
        )}
      </DraxView>
    </Animated.View>
  );
};
