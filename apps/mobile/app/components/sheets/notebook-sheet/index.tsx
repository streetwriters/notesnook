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
import { GroupHeader, Notebook, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";
import { RefreshControl, View, useWindowDimensions } from "react-native";
import ActionSheet, {
  ActionSheetRef,
  FlashList
} from "react-native-actions-sheet";
import Config from "react-native-config";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import create from "zustand";
import { notesnook } from "../../../../e2e/test.ids";
import { MMKV } from "../../../common/database/mmkv";
import { useNotebook } from "../../../hooks/use-notebook";
import NotebookScreen from "../../../screens/notebook";
import { openEditor } from "../../../screens/notes/common";
import { eSendEvent, presentSheet } from "../../../services/event-manager";
import useNavigationStore from "../../../stores/use-navigation-store";
import { useSelectionStore } from "../../../stores/use-selection-store";
import { eOnNotebookUpdated } from "../../../utils/events";
import { deleteItems } from "../../../utils/functions";
import { findRootNotebookId } from "../../../utils/notebooks";
import { SIZE, normalize } from "../../../utils/size";
import { Properties } from "../../properties";
import { IconButton } from "../../ui/icon-button";
import { PressableButton } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";
import { AddNotebookSheet } from "../add-notebook";
import Sort from "../sort";

const SelectionContext = createContext<{
  selection: Notebook[];
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggleSelection: (item: Notebook) => void;
}>({
  selection: [],
  enabled: false,
  setEnabled: (_value: boolean) => {},
  toggleSelection: (_item: Notebook) => {}
});
const useSelection = () => useContext(SelectionContext);

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
    return MMKV.getInt(NotebookSheetConfig.makeId(item)) || 0;
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

  const canShow = currentRoute === "Notebook";
  const [selection, setSelection] = useState<Notebook[]>([]);
  const [enabled, setEnabled] = useState(false);
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
  } = useNotebook(currentRoute === "Notebook" ? root : undefined);

  const PLACEHOLDER_DATA = {
    heading: "Notebooks",
    paragraph: "You have not added any notebooks yet.",
    button: "Add a notebook",
    action: () => {
      if (!notebook) return;
      AddNotebookSheet.present(undefined, notebook);
    },
    loading: "Loading notebook topics"
  };

  const renderNotebook = ({
    item,
    index
  }: {
    item: string | GroupHeader;
    index: number;
  }) =>
    (item as GroupHeader).type === "header" ? null : (
      <NotebookItem
        items={notebooks}
        id={item as string}
        index={index}
        totalNotes={totalNotes}
      />
    );

  const selectionContext = {
    selection: selection,
    enabled,
    setEnabled,
    toggleSelection: (item: Notebook) => {
      setSelection((state) => {
        const selection = [...state];
        const index = selection.findIndex(
          (selected) => selected.id === item.id
        );
        if (index > -1) {
          selection.splice(index, 1);
          if (selection.length === 0) {
            setEnabled(false);
          }
          return selection;
        }
        selection.push(item);
        return selection;
      });
    }
  };

  useEffect(() => {
    if (canShow) {
      setTimeout(async () => {
        if (!focusedRouteId) return;
        const nextRoot = await findRootNotebookId(focusedRouteId);
        setRoot(nextRoot);
        if (nextRoot !== currentItem.current) {
          setSelection([]);
          setEnabled(false);
        }
        currentItem.current = nextRoot;
        const snapPoint = NotebookSheetConfig.get({
          type: "notebook",
          id: nextRoot as string
        });

        if (ref.current?.isOpen()) {
          ref.current?.snapToIndex(snapPoint);
        } else {
          ref.current?.show(snapPoint);
        }
        onRequestUpdate();
      }, 0);
    } else {
      setSelection([]);
      setEnabled(false);
      ref.current?.hide();
    }
  }, [canShow, currentRoute, onRequestUpdate, focusedRouteId]);

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
      snapPoints={Config.isTesting === "true" ? [100] : [20, 100]}
      initialSnapIndex={1}
      backgroundInteractionEnabled
      gestureEnabled
    >
      <View
        style={{
          position: "absolute",
          right: 12,
          marginTop: -80
        }}
      >
        <PressableButton
          testID={notesnook.buttons.add}
          type="accent"
          onPress={openEditor}
          customStyle={{
            borderRadius: 100
          }}
        >
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              height: normalize(60),
              width: normalize(60)
            }}
          >
            <Icon name="plus" color="white" size={SIZE.xxl} />
          </View>
        </PressableButton>
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
          <Paragraph size={SIZE.xs} color={colors.primary.icon}>
            NOTEBOOKS
          </Paragraph>
          <View
            style={{
              flexDirection: "row"
            }}
          >
            {enabled ? (
              <IconButton
                customStyle={{
                  marginLeft: 10,
                  width: 40 * fontScale,
                  height: 40 * fontScale
                }}
                onPress={async () => {
                  //@ts-ignore
                  useSelectionStore.setState({
                    selectedItemsList: selection
                  });
                  await deleteItems();
                  useSelectionStore.getState().clearSelection();
                  setEnabled(false);
                  setSelection([]);
                  return;
                }}
                color={colors.primary.icon}
                tooltipText="Move to trash"
                tooltipPosition={1}
                name="delete"
                size={22}
              />
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
                  customStyle={{
                    width: 40 * fontScale,
                    height: 40 * fontScale
                  }}
                />
                <IconButton
                  name="plus"
                  onPress={PLACEHOLDER_DATA.action}
                  testID="add-topic-button"
                  color={colors.primary.icon}
                  size={22}
                  customStyle={{
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
                  customStyle={{
                    width: 40 * fontScale,
                    height: 40 * fontScale
                  }}
                />
              </>
            )}
          </View>
        </View>
        <SelectionContext.Provider value={selectionContext}>
          <FlashList
            data={notebooks?.ids}
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
            keyExtractor={(item) => item as string}
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
                <Paragraph color={colors.primary.icon}>No notebooks</Paragraph>
              </View>
            }
            ListFooterComponent={<View style={{ height: 50 }} />}
          />
        </SelectionContext.Provider>
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
  id: string;
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
  } = useNotebook(id, items);
  const isFocused = useNavigationStore((state) => state.focusedRouteId === id);
  const { colors } = useThemeColors("sheet");
  const selection = useSelection();
  const isSelected =
    selection.selection.findIndex((selected) => selected.id === item?.id) > -1;

  const { fontScale } = useWindowDimensions();
  const expanded = useNotebookExpandedStore((state) => state.expanded[id]);

  return (
    <View
      style={{
        paddingLeft: currentLevel > 0 && currentLevel < 6 ? 15 : undefined,
        width: "100%"
      }}
    >
      <PressableButton
        type={isSelected || isFocused ? "selected" : "transparent"}
        onLongPress={() => {
          if (selection.enabled || !item) return;
          selection.setEnabled(true);
          selection.toggleSelection(item);
        }}
        testID={`topic-sheet-item-${currentLevel}-${index}`}
        onPress={() => {
          if (!item) return;
          if (selection.enabled) {
            selection.toggleSelection(item);
            return;
          }
          NotebookScreen.navigate(item, true);
        }}
        customStyle={{
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
          flexDirection: "row",
          paddingLeft: 0,
          paddingRight: 12,
          borderRadius: 0
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          {selection.enabled ? (
            <IconButton
              size={SIZE.lg}
              color={isSelected ? colors.selected.icon : colors.primary.icon}
              top={0}
              left={0}
              bottom={0}
              right={0}
              customStyle={{
                width: 40,
                height: 40
              }}
              name={
                isSelected
                  ? "check-circle-outline"
                  : "checkbox-blank-circle-outline"
              }
            />
          ) : null}

          {nestedNotebooks?.ids.length ? (
            <IconButton
              size={SIZE.lg}
              color={isSelected ? colors.selected.icon : colors.primary.icon}
              onPress={() => {
                useNotebookExpandedStore.getState().setExpanded(id);
              }}
              top={0}
              left={0}
              bottom={0}
              right={0}
              customStyle={{
                width: 40,
                height: 40
              }}
              name={expanded ? "chevron-down" : "chevron-right"}
            />
          ) : (
            <>
              {selection?.enabled ? null : (
                <View
                  style={{
                    width: 40,
                    height: 40
                  }}
                />
              )}
            </>
          )}

          <Paragraph
            color={
              isFocused ? colors.selected.paragraph : colors.secondary.paragraph
            }
            size={SIZE.sm}
          >
            {item?.title}{" "}
            {totalNotes(id) ? (
              <Paragraph size={SIZE.xs} color={colors.secondary.paragraph}>
                {totalNotes(id)}
              </Paragraph>
            ) : null}
          </Paragraph>
        </View>
        <IconButton
          name="dots-horizontal"
          customStyle={{
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
          size={SIZE.xl}
        />
      </PressableButton>

      {!expanded
        ? null
        : nestedNotebooks?.ids.map((id, index) => (
            <NotebookItem
              key={id as string}
              id={id as string}
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
