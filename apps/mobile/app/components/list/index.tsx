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

import { GroupingKey, Item, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import { FlashList } from "@shopify/flash-list";
import React, { useEffect, useRef } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { notesnook } from "../../../e2e/test.ids";
import { useGroupOptions } from "../../hooks/use-group-options";
import { eSendEvent } from "../../services/event-manager";
import Sync from "../../services/sync";
import { RouteName } from "../../stores/use-navigation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { eScrollEvent } from "../../utils/events";
import { fluidTabsRef } from "../../utils/global-refs";
import { Header } from "../list-items/headers/header";
import { Empty, PlaceholderData } from "./empty";
import { ListItemWrapper } from "./list-item.wrapper";

type ListProps = {
  data: VirtualizedGrouping<Item> | undefined;
  dataType: Item["type"];
  mode?: "drawer" | "sheet";
  onRefresh?: () => void;
  loading?: boolean;
  headerTitle?: string;
  customAccentColor?: string;
  renderedInRoute?: RouteName;
  CustomLisHeader?: React.JSX.Element;
  isRenderedInActionSheet?: boolean;
  CustomListComponent?: React.JSX.ElementType;
  placeholder?: PlaceholderData;
  id?: string;
};

export default function List(props: ListProps) {
  const { colors } = useThemeColors();
  const scrollRef = useRef();
  const [notesListMode, notebooksListMode] = useSettingStore((state) => [
    state.settings.notesListMode,
    state.settings.notebooksListMode
  ]);

  const isCompactModeEnabled =
    (props.dataType === "note" && notesListMode === "compact") ||
    props.dataType === "notebook" ||
    notebooksListMode === "compact";

  const groupType =
    props.renderedInRoute === "Notes"
      ? "home"
      : props.renderedInRoute === "Favorites"
      ? "favorites"
      : props.renderedInRoute === "Trash"
      ? "trash"
      : `${props.dataType}s`;

  const groupOptions = useGroupOptions(groupType);

  const _onRefresh = async () => {
    Sync.run("global", false, "full", () => {
      props.onRefresh?.();
    });
  };

  const renderItem = React.useCallback(
    ({ index }: { index: number }) => {
      return (
        <ListItemWrapper
          index={index}
          isSheet={props.isRenderedInActionSheet || false}
          items={props.data}
          groupOptions={groupOptions}
          group={groupType as GroupingKey}
          renderedInRoute={props.renderedInRoute}
          customAccentColor={props.customAccentColor}
          dataType={props.dataType}
          scrollRef={scrollRef}
        />
      );
    },
    [
      groupOptions,
      groupType,
      props.customAccentColor,
      props.data,
      props.dataType,
      props.isRenderedInActionSheet,
      props.renderedInRoute
    ]
  );

  const onListScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!event) return;
      eSendEvent(eScrollEvent, {
        y: event.nativeEvent.contentOffset.y,
        route: props.renderedInRoute,
        id: props.id || props.renderedInRoute
      });
    },
    [props.renderedInRoute, props.id]
  );

  useEffect(() => {
    eSendEvent(eScrollEvent, {
      y: 0,
      route: props.renderedInRoute,
      id: props.id || props.renderedInRoute
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const styles = {
    width: "100%",
    minHeight: 1,
    minWidth: 1
  };

  const ListView = props.CustomListComponent
    ? props.CustomListComponent
    : FlashList;

  return (
    <>
      <Animated.View
        style={{
          flex: 1
        }}
        entering={props.renderedInRoute === "Search" ? undefined : FadeInDown}
      >
        <ListView
          style={styles}
          ref={scrollRef}
          testID={notesnook.list.id}
          data={props.data?.placeholders || []}
          renderItem={renderItem}
          onScroll={onListScroll}
          nestedScrollEnabled={true}
          onMomentumScrollEnd={() => {
            fluidTabsRef.current?.unlock();
          }}
          getItemType={(item: number, index: number) => {
            return props.data?.type(index);
          }}
          estimatedItemSize={isCompactModeEnabled ? 60 : 120}
          directionalLockEnabled={true}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
          refreshControl={
            props.isRenderedInActionSheet ? null : (
              <RefreshControl
                tintColor={colors.primary.accent}
                colors={[colors.primary.accent]}
                progressBackgroundColor={colors.secondary.background}
                onRefresh={_onRefresh}
                refreshing={false}
              />
            )
          }
          ListEmptyComponent={
            props.placeholder ? (
              <Empty
                loading={props.loading}
                title={props.headerTitle}
                dataType={props.dataType}
                color={props.customAccentColor}
                placeholder={props.placeholder}
                screen={props.renderedInRoute}
              />
            ) : null
          }
          ListHeaderComponent={
            <>
              {props.CustomLisHeader ? (
                props.CustomLisHeader
              ) : !props.headerTitle ? null : (
                <Header
                  color={props.customAccentColor}
                  screen={props.renderedInRoute}
                />
              )}
            </>
          }
        />
      </Animated.View>
    </>
  );
}
