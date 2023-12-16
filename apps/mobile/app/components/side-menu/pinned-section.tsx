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
import { FlatList, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import NotebookScreen from "../../screens/notebook";
import { TaggedNotes } from "../../screens/notes/tagged";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import useNavigationStore from "../../stores/use-navigation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { SIZE, normalize } from "../../utils/size";
import { Properties } from "../properties";
import { Button } from "../ui/button";
import { Notice } from "../ui/notice";
import { PressableButton } from "../ui/pressable";
import Seperator from "../ui/seperator";
import SheetWrapper from "../ui/sheet";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

export const TagsSection = React.memo(
  function TagsSection() {
    const [menuPins] = useMenuStore((state) => [state.menuPins]);
    const loading = useSettingStore((state) => state.isAppLoading);
    const setMenuPins = useMenuStore((state) => state.setMenuPins);

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
    const renderItem = ({ item }: { item: Notebook | Tag; index: number }) => {
      return <PinItem item={item} onPress={onPress} />;
    };

    return (
      <View
        style={{
          flexGrow: 1
        }}
      >
        <FlatList
          data={menuPins}
          style={{
            flexGrow: 1
          }}
          ListEmptyComponent={
            <Notice
              size="small"
              type="information"
              text="Add shortcuts for notebooks, topics and tags here."
            />
          }
          contentContainerStyle={{
            flexGrow: 1
          }}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
              title="Remove Shortcut"
              type="error"
              onPress={async () => {
                await db.shortcuts.remove(item.id);
                setVisible(false);
                setMenuPins();
              }}
              fontSize={SIZE.md}
              width="95%"
              customStyle={{
                marginBottom: 30
              }}
            />
          </SheetWrapper>
        )}
        <PressableButton
          type={isFocused ? "selected" : "gray"}
          onLongPress={() => {
            if (isPlaceholder) return;
            Properties.present(item);
          }}
          onPress={() => onPress(item)}
          customStyle={{
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
        </PressableButton>
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
