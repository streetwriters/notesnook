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

import { Color, Note } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../e2e/test.ids";
import { db } from "../../common/database";
import { eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import { useRelationStore } from "../../stores/use-relation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { refreshNotesPage } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import ColorPicker from "../dialogs/color-picker";
import { Button } from "../ui/button";
import NativeTooltip from "../../utils/tooltip";
import { Pressable } from "../ui/pressable";
import { strings } from "@notesnook/intl";

const ColorItem = ({ item, note }: { item: Color; note: Note }) => {
  const { colors } = useThemeColors();
  const [isLinked, setIsLinked] = useState<boolean>();
  const setColorNotes = useMenuStore((state) => state.setColorNotes);
  useEffect(() => {
    const checkIsLinked = async (color: Color) => {
      const hasRelation = await db.relations.from(color, "note").has(note.id);
      return hasRelation;
    };

    checkIsLinked(item).then((info) => setIsLinked(info));
  }, [item, note.id]);

  const toggleColor = async () => {
    await db.relations.to(note, "color").unlink();

    if (!isLinked) {
      await db.relations.add(item, note);
    }

    useRelationStore.getState().update();
    setColorNotes();
    Navigation.queueRoutesForUpdate();
    eSendEvent(refreshNotesPage);
  };

  return (
    <Pressable
      type="accent"
      accentColor={item.colorCode}
      accentText={colors.static.white}
      testID={notesnook.ids.dialogs.actionsheet.color(item.colorCode)}
      key={item.id}
      onPress={toggleColor}
      onLongPress={(event) => {
        NativeTooltip.show(event, item.title, NativeTooltip.POSITIONS.TOP);
      }}
      style={{
        width: 35,
        height: 35,
        borderRadius: 100,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 5
      }}
    >
      {isLinked ? (
        <Icon
          testID="icon-check"
          name="check"
          color="white"
          size={AppFontSize.lg}
        />
      ) : null}
    </Pressable>
  );
};

export const ColorTags = ({ item }: { item: Note }) => {
  const { colors } = useThemeColors();
  const colorNotes = useMenuStore((state) => state.colorNotes);
  const isTablet = useSettingStore((state) => state.deviceMode) !== "mobile";
  const updater = useRelationStore((state) => state.updater);
  const [visible, setVisible] = useState(false);
  const note = item;

  const renderItem = useCallback(
    ({ item }: { item: Color }) => (
      <ColorItem note={note} key={item.id} item={item} />
    ),
    [note]
  );

  return (
    <>
      <ColorPicker
        visible={visible}
        setVisible={setVisible}
        onColorAdded={async (color) => {
          await db.relations.to(note, "color").unlink();
          await db.relations.add(color, note);
          useRelationStore.getState().update();
          useMenuStore.getState().setColorNotes();
          Navigation.queueRoutesForUpdate();
          eSendEvent(refreshNotesPage);
        }}
      />
      <View
        style={{
          flexGrow: isTablet ? undefined : 1,
          flexDirection: "row",
          marginLeft: 5,
          flexShrink: 2
        }}
      >
        <FlashList
          data={colorNotes}
          estimatedItemSize={30}
          horizontal
          extraData={updater}
          bounces={false}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          ListFooterComponent={
            !colorNotes || !colorNotes.length ? (
              <Button
                onPress={async () => {
                  useSettingStore.getState().setSheetKeyboardHandler(false);
                  setVisible(true);
                }}
                buttonType={{
                  text: colors.primary.accent
                }}
                title={strings.addColor()}
                type="secondary"
                icon="plus"
                iconPosition="right"
                height={30}
                fontSize={AppFontSize.xs}
                style={{
                  marginRight: 5,
                  borderRadius: 100,
                  paddingHorizontal: 8
                }}
              />
            ) : (
              <Pressable
                style={{
                  width: 35,
                  height: 35,
                  borderRadius: 100,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 5
                }}
                type="secondary"
                onPress={() => {
                  useSettingStore.getState().setSheetKeyboardHandler(false);
                  setVisible(true);
                }}
              >
                <Icon
                  testID="icon-plus"
                  name="plus"
                  color={colors.primary.icon}
                  size={AppFontSize.lg}
                />
              </Pressable>
            )
          }
        />
      </View>
    </>
  );
};
