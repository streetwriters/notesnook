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

import React, { useRef, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  DraxList,
  DraxListProps,
  DraxListRenderItemContent,
  DraxProvider
} from "react-native-drax";
import { IconButton } from "../ui/icon-button";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import Paragraph from "../ui/typography/paragraph";
import { Button } from "../ui/button";

interface ReorderableListProps<T = never>
  extends Omit<DraxListProps<T>, "renderItem"> {
  onListOrderChanged: (data: any) => void;
  renderDraggableItem: DraxListRenderItemContent<T>;
  initialListData: T[];
}

function ReorderableList<T>({
  renderDraggableItem,
  initialListData,
  onListOrderChanged,
  ...restProps
}: ReorderableListProps<T>) {
  const colors = useThemeStore((state) => state.colors);
  const [data, setData] = useState(initialListData || []);
  const [dragging, setDragging] = useState(false);
  const listRef = useRef<FlatList | null>(null);
  return (
    <DraxProvider>
      <View style={styles.container}>
        <DraxList
          {...restProps}
          ref={listRef}
          data={data}
          renderItemContent={(info, props) =>
            !(info.item as any).visible && !dragging ? null : (
              <View
                style={{
                  flexDirection: "row",
                  opacity: !(info.item as any).visible ? 0.4 : 1
                }}
              >
                <View
                  style={{
                    flexGrow: 1
                  }}
                >
                  {renderDraggableItem(info, props)}
                </View>
                {dragging && !props.hover ? (
                  <IconButton
                    name={(info.item as any).visible ? "minus" : "plus"}
                    color={colors.icon}
                    size={SIZE.lg}
                    top={0}
                    bottom={0}
                    onPress={() => {
                      const newData = data.slice();
                      newData.splice(info.index, 1);
                      if ((info.item as any).visible) {
                        newData.push({
                          ...info.item,
                          visible: false
                        });
                      } else {
                        newData.push({
                          ...info.item,
                          visible: true
                        });
                      }
                      onListOrderChanged?.(newData);
                      setData(newData);
                    }}
                  />
                ) : null}
              </View>
            )
          }
          itemStyles={{
            hoverDragReleasedStyle: {
              display: "none"
            },
            dragReleasedStyle: {
              opacity: 1
            }
          }}
          longPressDelay={500}
          onItemDragStart={() => setDragging(true)}
          lockItemDragsToMainAxis
          onItemReorder={({ fromIndex, fromItem, toIndex, toItem }) => {
            const newData = data.slice();
            newData.splice(toIndex, 0, newData.splice(fromIndex, 1)[0]);
            onListOrderChanged?.(newData);
            setData(newData);
          }}
          keyExtractor={(item) => (item as any).id}
          ListHeaderComponent={() =>
            !dragging ? null : (
              <View
                style={{
                  flexDirection: "row",
                  borderRadius: 5,
                  marginBottom: 12,
                  height: 30,
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <IconButton
                  name="reorder-horizontal"
                  size={25}
                  customStyle={{
                    width: 30,
                    height: 30,
                    marginRight: 5
                  }}
                  color={colors.icon}
                />

                <Button
                  style={{
                    borderRadius: 100
                  }}
                  type="grayAccent"
                  title="Done"
                  fontSize={SIZE.sm}
                  height={27}
                  onPress={() => {
                    setDragging(false);
                  }}
                />
              </View>
            )
          }
        />
      </View>
    </DraxProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

export default ReorderableList;
