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

import { Notebook, Tag } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import NotebookScreen from "../../screens/notebook";
import { TaggedNotes } from "../../screens/notes/tagged";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { SIZE, normalize } from "../../utils/size";
import ReorderableList from "../list/reorderable-list";
import { Button } from "../ui/button";
import { Notice } from "../ui/notice";
import { Pressable } from "../ui/pressable";
import Seperator from "../ui/seperator";
import SheetWrapper from "../ui/sheet";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { strings } from "@notesnook/intl";

export const PinnedSection = React.memo(
  function PinnedSection() {
    const menuPins = useMenuStore((state) => state.menuPins);
    const loading = useSettingStore((state) => state.isAppLoading);
    const setMenuPins = useMenuStore((state) => state.setMenuPins);
    const [order] = useMenuStore((state) => [state.order["shortcuts"]]);
    useEffect(() => {
      if (!loading) {
        setMenuPins();
      }
    }, [loading, setMenuPins]);

    const onPress = (item: Notebook | Tag) => {
      if (item.type === "notebook") {
        NotebookScreen.navigate(item);
      } else if (item.type === "tag") {
        TaggedNotes.navigate(item);
      }
      setImmediate(() => {
        Navigation.closeDrawer();
      });
    };
    const renderItem = ({
      item,
      index
    }: {
      item: Notebook | Tag;
      index: number;
    }) => {
      return <PinItem item={item} onPress={onPress} />;
    };

    return (
      <View
        style={{
          flexGrow: 1
        }}
      >
        <ReorderableList
          onListOrderChanged={(data) => {
            db.settings.setSideBarOrder("shortcuts", data);
          }}
          onHiddenItemsChanged={(data) => {}}
          canHideItems={false}
          itemOrder={order}
          hiddenItems={[]}
          alwaysBounceVertical={false}
          data={menuPins}
          style={{
            flexGrow: 1,
            width: "100%"
          }}
          contentContainerStyle={{
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={false}
          renderDraggableItem={renderItem}
          ListEmptyComponent={
            <Notice
              size="small"
              type="information"
              text={strings.sideMenuNotice()}
              style={{
                marginHorizontal: 12
              }}
            />
          }
        />
      </View>
    );
  },
  () => true
);

export const PinItem = React.memo(
  function PinItem({
    item,
    onPress,
    isPlaceholder
  }: {
    item: Notebook | Tag;
    onPress: (item: Notebook | Tag) => void;
    isPlaceholder?: boolean;
  }) {
    const { colors } = useThemeColors();
    const setMenuPins = useMenuStore((state) => state.setMenuPins);

    const [visible, setVisible] = useState(false);
    const isFocused = useNavigationStore(
      (state) => state.focusedRouteId === item.id
    );
    const primaryColors = isFocused ? colors.selected : colors.primary;
    const color = isFocused ? colors.selected.accent : colors.primary.icon;
    const fwdRef = useRef();

    const icons = {
      topic: "bookmark",
      notebook: "book-outline",
      tag: "pound"
    };

    return (
      <>
        {visible && (
          <SheetWrapper
            onClose={() => {
              setVisible(false);
            }}
            gestureEnabled={false}
            fwdRef={fwdRef}
          >
            <Seperator />
            <Button
              title={strings.removeShortcut()}
              type="error"
              onPress={async () => {
                await db.shortcuts.remove(item.id);
                setVisible(false);
                setMenuPins();
              }}
              fontSize={SIZE.md}
              width="95%"
              style={{
                marginBottom: 30
              }}
            />
          </SheetWrapper>
        )}
        <Pressable
          type={isFocused ? "selected" : "plain"}
          onPress={() => onPress(item)}
          style={{
            width: "100%",
            alignSelf: "center",
            borderRadius: 5,
            flexDirection: "row",
            paddingHorizontal: 8,
            justifyContent: "space-between",
            alignItems: "center",
            height: normalize(50),
            marginBottom: 5
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexGrow: 1,
              flex: 1
            }}
          >
            <View
              style={{
                width: 30,
                justifyContent: "center"
              }}
            >
              <Icon
                allowFontScaling
                color={color}
                size={SIZE.lg - 2}
                name={icons[item.type]}
              />
              <Icon
                style={{
                  position: "absolute",
                  bottom: -6,
                  left: -6
                }}
                allowFontScaling
                color={color}
                size={SIZE.xs}
                name="arrow-top-right-thick"
              />
            </View>
            <View
              style={{
                alignItems: "flex-start",
                flexGrow: 1,
                flex: 1
              }}
            >
              {isFocused ? (
                <Heading
                  style={{
                    flexWrap: "wrap"
                  }}
                  color={primaryColors.heading}
                  size={SIZE.md}
                >
                  {item.title}
                </Heading>
              ) : (
                <Paragraph
                  numberOfLines={1}
                  color={primaryColors.paragraph}
                  size={SIZE.md}
                >
                  {item.title}
                </Paragraph>
              )}
            </View>
          </View>
        </Pressable>
      </>
    );
  },
  (prev, next) => {
    if (!next.item) return false;
    if (prev.item.title !== next.item.title) return false;
    if (prev.item?.dateModified !== next.item?.dateModified) return false;
    if (prev.item?.id !== next.item?.id) return false;
    return true;
  }
);
