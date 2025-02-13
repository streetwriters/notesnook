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

import * as React from "react";
import { View } from "react-native";
import { DraxDragWithReceiverEventData, DraxView } from "react-native-drax";
import Animated, { Layout } from "react-native-reanimated";
import { presentDialog } from "../../../components/dialog/functions";
import { IconButton } from "../../../components/ui/icon-button";
import Paragraph from "../../../components/ui/typography/paragraph";
import { useThemeColors } from "@notesnook/theme";
import { getElevationStyle } from "../../../utils/elevation";
import { AppFontSize } from "../../../utils/size";
import { renderTool } from "./common";
import { DraggableItem, useDragState } from "./state";
import ToolSheet from "./tool-sheet";

import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import type { ToolId } from "@notesnook/editor";
import PremiumService from "../../../services/premium";
import { strings } from "@notesnook/intl";

export const Group = ({
  item,
  index: groupIndex,
  parentIndex
}: DraggableItem) => {
  const setData = useDragState((state) => state.setData);
  const [dragged, setDragged] = useDragState((state) => [
    state.dragged,
    state.setDragged
  ]);
  const [_recieving, setRecieving] = React.useState(false);
  const [recievePosition, setRecievePosition] = React.useState("above");
  const isDragged =
    dragged &&
    Array.isArray(dragged?.item) &&
    dragged?.item[0] === item[0] &&
    parentIndex === undefined;

  const isSubgroup = parentIndex !== undefined;
  const dimensions = React.useRef({
    height: 0,
    width: 0
  });
  const { colors } = useThemeColors();

  const onDrop = (data: DraxDragWithReceiverEventData) => {
    if (!PremiumService.get()) {
      PremiumService.sheet("global");
      return;
    }
    const isDroppedAbove = data.receiver.receiveOffsetRatio.y < 0.5;
    const dragged = data.dragged.payload;
    const reciever = data.receiver.payload;
    const _data = useDragState.getState().data.slice();

    if (dragged.type === "group") {
      const fromIndex = dragged.index;
      const toIndex = isDroppedAbove
        ? Math.max(0, reciever.index)
        : reciever.index + 1;

      _data.splice(
        toIndex > fromIndex ? toIndex - 1 : toIndex,
        0,
        _data.splice(fromIndex, 1)[0]
      );
    }

    // Always insert sub group at the end of the group.
    if (dragged.type === "subgroup") {
      const fromIndex = dragged.index;

      const insertAt = _data[reciever.index] as string[];
      const insertFrom = _data[dragged.groupIndex] as string[];

      if (typeof insertAt[insertAt.length - 1] !== "string") {
        setRecieving(false);
        return data.dragAbsolutePosition;
      }
      insertAt.push(insertFrom.splice(fromIndex, 1)[0]);
    }

    if (dragged.type === "tool") {
      const insertFrom =
        typeof dragged.parentIndex === "number"
          ? (_data[dragged.parentIndex][dragged.groupIndex] as string[])
          : (_data[dragged.groupIndex] as string[]);
      _data[groupIndex].push(insertFrom.splice(dragged.index, 1)[0] as ToolId);
    }

    setData(_data);
    setRecieving(false);
    return data.dragAbsolutePosition;
  };

  const onRecieveData = (data: DraxDragWithReceiverEventData) => {
    setRecieving(true);
    if (data.dragged.payload.type !== "group")
      return setRecievePosition("below");
    if (data.receiver.receiveOffsetRatio.y < 0.5) {
      setRecievePosition("above");
    } else {
      setRecievePosition("below");
    }
  };

  const buttons = [
    {
      name: "minus",
      onPress: () => {
        if (!PremiumService.get()) {
          PremiumService.sheet("global");
          return;
        }
        presentDialog({
          context: "global",
          title: strings.deleteGroup(),
          positiveText: strings.delete(),
          paragraph: strings.deleteGroupDesc(),
          positivePress: () => {
            if (groupIndex === undefined) return;
            const _data = useDragState.getState().data.slice();

            _data.splice(groupIndex, 1);

            setData(_data);
          }
        });
      }
    },
    {
      name: "plus",
      onPress: () => {
        if (!PremiumService.get()) {
          PremiumService.sheet("global");
          return;
        }
        ToolSheet.present({
          item,
          index: groupIndex
        });
      }
    }
  ];

  const renderGroup = (hover: boolean) => {
    const isSubgroup = parentIndex !== undefined;

    return (
      <View
        onLayout={(event) => {
          if (hover) return;
          if (!isDragged) dimensions.current = event.nativeEvent.layout;
        }}
        style={[
          {
            width: isDragged ? dimensions.current?.width : "100%",
            backgroundColor: colors.primary.background,
            borderRadius: 10,
            ...getElevationStyle(hover ? 5 : 0),
            marginTop: isSubgroup ? 0 : 10
          }
        ]}
      >
        {isSubgroup ? null : (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              height: 40,
              marginBottom: 5
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center"
              }}
            >
              <Icon
                size={AppFontSize.md}
                name="drag"
                color={colors.primary.icon}
              />
              <Paragraph
                style={{
                  marginLeft: 5
                }}
                color={colors.secondary.paragraph}
                size={AppFontSize.xs}
              >
                {strings.group()}
              </Paragraph>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center"
              }}
            >
              {buttons.map((item) => (
                <IconButton
                  top={0}
                  left={0}
                  bottom={0}
                  right={0}
                  key={item.name}
                  style={{
                    marginLeft: 10
                  }}
                  onPress={item.onPress}
                  name={item.name}
                  color={colors.primary.icon}
                  size={AppFontSize.lg}
                />
              ))}
            </View>
          </View>
        )}

        {isDragged && hover
          ? null
          : renderTool({
              item,
              index: groupIndex,
              groupIndex,
              parentIndex: parentIndex
            })}
      </View>
    );
  };

  return (
    <Animated.View layout={Layout}>
      <DraxView
        longPressDelay={500}
        receptive={
          (dragged.type === "subgroup" && dragged.groupIndex === groupIndex) ||
          (dragged.type === "tool" && item.length > 0) ||
          (dragged.type === "group" && isSubgroup) ||
          (dragged.type === "subgroup" && isSubgroup) ||
          (dragged.type === "subgroup" &&
            dragged.item &&
            dragged.item[0] === item[0])
            ? false
            : true
        }
        payload={{
          item,
          index: groupIndex,
          parentIndex,
          type: "group"
        }}
        onDragStart={() => {
          setDragged({
            item,
            type: "group",
            ...dimensions.current
          });
        }}
        onDragDrop={() => {
          setDragged({});
        }}
        onDragEnd={() => {
          setDragged({});
        }}
        hoverDragReleasedStyle={{
          opacity: 0
        }}
        receivingStyle={{
          paddingBottom: recievePosition === "below" ? 50 : 0,
          paddingTop: recievePosition === "above" ? 50 : 0,
          backgroundColor:
            dragged.type === "subgroup"
              ? colors.secondary.background
              : undefined,
          marginTop: recievePosition === "above" ? 10 : 0,
          marginBottom: recievePosition === "below" ? 10 : 0,
          borderRadius: 10
        }}
        renderHoverContent={() => renderGroup(true)}
        onReceiveDragDrop={onDrop}
        onReceiveDragOver={onRecieveData}
        onReceiveDragExit={() => {
          setRecieving(false);
        }}
        onReceiveDragEnter={onRecieveData}
      >
        {!isDragged ? renderGroup(false) : <View />}
      </DraxView>
    </Animated.View>
  );
};
