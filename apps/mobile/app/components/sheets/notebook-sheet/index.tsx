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
import { Notebook, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  RefreshControl,
  View,
  useWindowDimensions
} from "react-native";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import { FlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import Config from "react-native-config";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import create from "zustand";
import { notesnook } from "../../../../e2e/test.ids";
import { db } from "../../../common/database";
import { MMKV } from "../../../common/database/mmkv";
import { useNotebook } from "../../../hooks/use-notebook";
import NotebookScreen from "../../../screens/notebook";
import { openEditor } from "../../../screens/notes/common";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import { createItemSelectionStore } from "../../../stores/item-selection-store";
import useNavigationStore from "../../../stores/use-navigation-store";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { eOnNotebookUpdated } from "../../../utils/events";
import { deleteItems } from "../../../utils/functions";
import { findRootNotebookId } from "../../../utils/notebooks";
import { AppFontSize, normalize } from "../../../utils/size";
import { Properties } from "../../properties";
import { IconButton } from "../../ui/icon-button";
import { Pressable } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";
import { AddNotebookSheet } from "../add-notebook";
import { MoveNotebookSheet } from "../move-notebook";
import Sort from "../sort";
import { strings } from "@notesnook/intl";

const useItemSelectionStore = createItemSelectionStore(true, false);

type NotebookParentProp = {
  parent?: NotebookParentProp;
  item?: Notebook;
};

type ConfigItem = { id: string; type: string };
class NotebookSheetConfig {
  static storageKey: "$$sp";

  static makeId(item: ConfigItem) {
    return `${NotebookSheetConfig.storageKey}:${item.type}:${item.id}`;
  }

  static get(item: ConfigItem) {
    const value = MMKV.getInt(NotebookSheetConfig.makeId(item));
    return typeof value === "number" ? value : 0;
  }

  static set(item: ConfigItem, index = 0) {
    MMKV.setInt(NotebookSheetConfig.makeId(item), index);
  }
}

const useNotebookExpandedStore = create<{
  expanded: {
    [id: string]: boolean;
  };
  setExpanded: (id: string) => void;
}>((set, get) => ({
  expanded: {},
  setExpanded(id: string) {
    set({
      expanded: {
        ...get().expanded,
        [id]: !get().expanded[id]
      }
    });
  }
}));

export const NotebookSheet = () => {
  const [collapsed, setCollapsed] = useState(false);
  const currentRoute = useNavigationStore((state) => state.currentRoute);
  const focusedRouteId = useNavigationStore((state) => state.focusedRouteId);
  const enabled = useItemSelectionStore((state) => state.enabled);
  const canShow = currentRoute === "Notebook";
  const { colors } = useThemeColors("sheet");
  const ref = useRef<ActionSheetRef>(null);
  const currentItem = useRef<string>();
  const { fontScale } = useWindowDimensions();
  const [root, setRoot] = useState<string>();
  const {
    onUpdate: onRequestUpdate,
    notebook,
    nestedNotebooks: notebooks,
    nestedNotebookNotesCount: totalNotes,
    groupOptions
  } = useNotebook(
    currentRoute === "Notebook" ? root : undefined,
    undefined,
    true
  );

  const renderNotebook = ({ index }: { item: boolean; index: number }) => (
    <NotebookItem
      items={notebooks}
      id={index}
      index={index}
      totalNotes={totalNotes}
    />
  );

  useEffect(() => {
    if (canShow) {
      setImmediate(async () => {
        if (!focusedRouteId) return;
        const nextRoot = await findRootNotebookId(focusedRouteId);
        if (nextRoot !== currentItem.current) {
          useItemSelectionStore.setState({
            enabled: false,
            selection: {}
          });
        }
        currentItem.current = nextRoot;
        const snapPoint = NotebookSheetConfig.get({
          type: "notebook",
          id: focusedRouteId as string
        });

        if (ref.current?.isOpen()) {
          ref.current?.snapToIndex(snapPoint);
        } else {
          ref.current?.show(snapPoint);
        }
        setRoot(nextRoot);
        onRequestUpdate();
      });
    } else {
      if (ref.current?.isOpen()) {
        useItemSelectionStore.setState({
          enabled: false,
          selection: {}
        });
        ref.current?.hide();
      }
    }
  }, [canShow, focusedRouteId]);

  return (
    <ActionSheet
      ref={ref}
      isModal={false}
      containerStyle={{
        maxHeight: 300,
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        backgroundColor: colors.primary.background,
        borderWidth: 1,
        borderColor: colors.primary.border,
        borderBottomWidth: 0
      }}
      openAnimationConfig={{
        friction: 10
      }}
      onSnapIndexChange={(index) => {
        setCollapsed(index === 0);
        NotebookSheetConfig.set(
          {
            type: "notebook",
            id: focusedRouteId as string
          },
          index
        );
      }}
      overlayColor={colors.primary.backdrop}
      closable={!canShow}
      elevation={10}
      indicatorStyle={{
        width: 100,
        backgroundColor: colors.secondary.background
      }}
      keyboardHandlerEnabled={false}
      snapPoints={
        Config.isTesting === "true"
          ? [100]
          : [Platform.OS === "android" ? 15 : 10, 100]
      }
      initialSnapIndex={1}
      backgroundInteractionEnabled
      gestureEnabled
    >
      {/* <View
        style={{
          position: "absolute",
          right: 24 + normalize(50),
          marginTop: -80
        }}
      >
        <Pressable
          testID="add-notebook-button"
          type="secondary"
          onPress={() => {
            if (!notebook) return;
            
          }}
          style={{
            borderRadius: 100
          }}
        >
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: normalize(50),
              width: normalize(50)
            }}
          >
            <Icon
              name="notebook-plus"
              color={colors.primary.icon}
              size={SIZE.xxl}
            />
          </View>
        </Pressable>
      </View> */}

      <View
        style={{
          position: "absolute",
          right: 12,
          marginTop: -80
        }}
      >
        <Pressable
          testID={notesnook.buttons.add}
          type="accent"
          onPress={openEditor}
          style={{
            borderRadius: 100
          }}
        >
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: normalize(50),
              width: normalize(50)
            }}
          >
            <Icon name="plus" color="white" size={AppFontSize.xxl} />
          </View>
        </Pressable>
      </View>
      <View
        style={{
          maxHeight: 450,
          height: 450,
          width: "100%"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            alignItems: "center"
          }}
        >
          <Paragraph size={AppFontSize.xs} color={colors.primary.icon}>
            {strings.notebooks()}
          </Paragraph>
          <View
            style={{
              flexDirection: "row"
            }}
          >
            {enabled ? (
              <>
                <IconButton
                  style={{
                    marginLeft: 10,
                    width: 40 * fontScale,
                    height: 40 * fontScale
                  }}
                  onPress={async () => {
                    await deleteItems(
                      "notebook",
                      useItemSelectionStore.getState().getSelectedItemIds()
                    );
                    useSelectionStore.getState().clearSelection();
                    useItemSelectionStore.setState({
                      enabled: false,
                      selection: {}
                    });
                    return;
                  }}
                  color={colors.primary.icon}
                  tooltipText="Move to trash"
                  tooltipPosition={1}
                  name="delete"
                  size={22}
                />

                <IconButton
                  style={{
                    marginLeft: 10,
                    width: 40 * fontScale,
                    height: 40 * fontScale
                  }}
                  onPress={async () => {
                    const ids = useItemSelectionStore
                      .getState()
                      .getSelectedItemIds();
                    const notebooks = await db.notebooks.all.items(ids);
                    MoveNotebookSheet.present(notebooks);
                  }}
                  color={colors.primary.icon}
                  tooltipText="Clear selection"
                  tooltipPosition={1}
                  name="arrow-right-bold-box-outline"
                  size={22}
                />

                <IconButton
                  style={{
                    marginLeft: 10,
                    width: 40 * fontScale,
                    height: 40 * fontScale
                  }}
                  onPress={() => {
                    useSelectionStore.getState().clearSelection();
                    useItemSelectionStore.setState({
                      enabled: false,
                      selection: {}
                    });
                  }}
                  color={colors.primary.icon}
                  tooltipText="Clear selection"
                  tooltipPosition={1}
                  name="close"
                  size={22}
                />
              </>
            ) : (
              <>
                <IconButton
                  name={
                    groupOptions?.sortDirection === "asc"
                      ? "sort-ascending"
                      : "sort-descending"
                  }
                  onPress={() => {
                    presentSheet({
                      component: <Sort screen="TopicSheet" type="notebook" />
                    });
                  }}
                  testID="group-topic-button"
                  color={colors.primary.icon}
                  size={22}
                  style={{
                    width: 40 * fontScale,
                    height: 40 * fontScale
                  }}
                />

                <IconButton
                  name={collapsed ? "chevron-up" : "chevron-down"}
                  onPress={() => {
                    if (ref.current?.currentSnapIndex() !== 0) {
                      setCollapsed(true);
                      ref.current?.snapToIndex(0);
                    } else {
                      setCollapsed(false);
                      ref.current?.snapToIndex(1);
                    }
                  }}
                  color={colors.primary.icon}
                  size={22}
                  style={{
                    width: 40 * fontScale,
                    height: 40 * fontScale
                  }}
                />

                <IconButton
                  testID="add-notebook-button"
                  name="notebook-plus"
                  onPress={() => {
                    if (!notebook) return;
                    AddNotebookSheet.present(
                      undefined,
                      notebook,
                      undefined,
                      undefined,
                      false
                    );
                  }}
                  color={colors.primary.icon}
                  size={22}
                  style={{
                    width: 40 * fontScale,
                    height: 40 * fontScale
                  }}
                />
              </>
            )}
          </View>
        </View>
        <FlashList
          data={notebooks?.placeholders}
          style={{
            width: "100%"
          }}
          estimatedItemSize={50}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                eSendEvent(eOnNotebookUpdated);
              }}
              colors={[colors.primary.accent]}
              progressBackgroundColor={colors.primary.background}
            />
          }
          renderItem={renderNotebook}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                height: 200
              }}
            >
              <Paragraph color={colors.primary.icon}>
                {strings.emptyPlaceholders("notebook")}
              </Paragraph>
            </View>
          }
        />
      </View>
    </ActionSheet>
  );
};

const NotebookItem = ({
  id,
  totalNotes,
  currentLevel = 0,
  index,
  parent,
  items
}: {
  id: string | number;
  totalNotes: (id: string) => number;
  currentLevel?: number;
  index: number;
  parent?: NotebookParentProp;
  items?: VirtualizedGrouping<Notebook>;
}) => {
  const {
    nestedNotebookNotesCount,
    nestedNotebooks,
    notebook: item
  } = useNotebook(id, items, true);
  const isFocused = useNavigationStore((state) => state.focusedRouteId === id);
  const { colors } = useThemeColors("sheet");
  const isSelected = useItemSelectionStore((state) =>
    item?.id ? state.selection[item.id] === "selected" : false
  );
  const enabled = useItemSelectionStore((state) => state.enabled);

  const { fontScale } = useWindowDimensions();
  const expanded = useNotebookExpandedStore((state) =>
    item?.id ? state.expanded[item?.id] : undefined
  );

  return (
    <View
      style={{
        paddingLeft: currentLevel > 0 && currentLevel < 6 ? 15 : undefined,
        width: "100%"
      }}
    >
      <Pressable
        type={isSelected || isFocused ? "selected" : "transparent"}
        onLongPress={() => {
          if (enabled || !item) return;
          useItemSelectionStore.setState({
            enabled: true,
            selection: {}
          });
          useItemSelectionStore
            .getState()
            .markAs(item, isSelected ? "deselected" : "selected");
        }}
        testID={`notebook-sheet-item-${currentLevel}-${index}`}
        onPress={() => {
          if (!item) return;
          if (enabled) {
            useItemSelectionStore
              .getState()
              .markAs(item, isSelected ? "deselected" : "selected");
            return;
          }
          NotebookScreen.navigate(item, true);
        }}
        style={{
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
          flexDirection: "row",
          paddingHorizontal: 12,
          borderRadius: 0
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          {nestedNotebooks?.placeholders.length ? (
            <IconButton
              size={AppFontSize.lg}
              color={isSelected ? colors.selected.icon : colors.primary.icon}
              onPress={() => {
                if (!item?.id) return;
                useNotebookExpandedStore.getState().setExpanded(item?.id);
              }}
              top={0}
              left={0}
              bottom={0}
              right={0}
              style={{
                width: 35,
                height: 35
              }}
              name={expanded ? "chevron-down" : "chevron-right"}
            />
          ) : (
            <View
              style={{
                width: 35,
                height: 35
              }}
            />
          )}

          {enabled ? (
            <IconButton
              size={AppFontSize.lg}
              color={isSelected ? colors.selected.icon : colors.primary.icon}
              top={0}
              left={0}
              bottom={0}
              right={0}
              style={{
                width: 35,
                height: 35,
                marginRight: 5
              }}
              name={
                isSelected
                  ? "check-circle-outline"
                  : "checkbox-blank-circle-outline"
              }
            />
          ) : null}

          <Paragraph
            color={
              isFocused ? colors.selected.paragraph : colors.secondary.paragraph
            }
            size={AppFontSize.sm}
          >
            {item?.title}
          </Paragraph>
        </View>

        <View
          style={{
            flexDirection: "row",
            columnGap: 10,
            alignItems: "center"
          }}
        >
          {item?.id && totalNotes?.(item?.id) ? (
            <Paragraph size={AppFontSize.sm} color={colors.secondary.paragraph}>
              {totalNotes(item?.id)}
            </Paragraph>
          ) : null}
          <IconButton
            name="dots-horizontal"
            style={{
              width: 40 * fontScale,
              height: 40 * fontScale
            }}
            testID={notesnook.ids.notebook.menu}
            onPress={() => {
              Properties.present(item);
            }}
            left={0}
            right={0}
            bottom={0}
            top={0}
            color={colors.primary.icon}
            size={AppFontSize.xl}
          />
        </View>
      </Pressable>

      {!expanded
        ? null
        : item &&
          nestedNotebooks?.placeholders.map((id, index) => (
            <NotebookItem
              key={item.id + "_" + index}
              id={index}
              index={index}
              totalNotes={nestedNotebookNotesCount}
              currentLevel={currentLevel + 1}
              items={nestedNotebooks}
              parent={{
                parent: parent,
                item: item
              }}
            />
          ))}
    </View>
  );
};
