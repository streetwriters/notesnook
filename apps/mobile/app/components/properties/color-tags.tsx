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

import { DefaultColors } from "@notesnook/core/dist/collections/colors";
import { Note } from "@notesnook/core/dist/types";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../e2e/test.ids";
import { db } from "../../common/database";
import { eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import { useRelationStore } from "../../stores/use-relation-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { refreshNotesPage } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { PressableButton } from "../ui/pressable";

export const ColorTags = ({ item }: { item: Note }) => {
  const { colors } = useThemeColors();
  const setColorNotes = useMenuStore((state) => state.setColorNotes);
  const isTablet = useSettingStore((state) => state.deviceMode) !== "mobile";
  const updater = useRelationStore((state) => state.updater);

  const getColorInfo = (colorCode: string) => {
    const dbColor = db.colors.all.find((v) => v.colorCode === colorCode);
    let isLinked = false;

    if (dbColor) {
      const note = db.relations
        .from(dbColor, "note")
        .find((relation) => relation.to.id === item.id);

      if (note) {
        isLinked = true;
      }
    }

    return {
      linked: isLinked,
      item: dbColor
    };
  };

  const changeColor = async (color: string) => {
    const colorInfo = getColorInfo(DefaultColors[color]);

    if (colorInfo.item) {
      if (colorInfo.linked) {
        await db.relations.unlink(colorInfo.item, item);
      } else {
        await db.relations.add(colorInfo.item, item);
      }
    } else {
      const colorId = await db.colors.add({
        title: color,
        colorCode: DefaultColors[color]
      });

      const dbColor = db.colors.color(colorId);
      if (dbColor) {
        await db.relations.add(dbColor, item);
      }
    }

    useRelationStore.getState().update();
    setColorNotes();
    Navigation.queueRoutesForUpdate();
    eSendEvent(refreshNotesPage);
  };

  const _renderColor = (name: keyof typeof DefaultColors) => {
    const color = DefaultColors[name];
    const colorInfo = getColorInfo(color);

    return (
      <PressableButton
        type="accent"
        accentColor={color}
        accentText={colors.static.white}
        testID={notesnook.ids.dialogs.actionsheet.color(name)}
        key={color}
        onPress={() => changeColor(name)}
        customStyle={{
          width: 30,
          height: 30,
          borderRadius: 100,
          justifyContent: "center",
          alignItems: "center",
          marginRight: isTablet ? 10 : undefined
        }}
      >
        {colorInfo.linked ? (
          <Icon testID="icon-check" name="check" color="white" size={SIZE.lg} />
        ) : null}
      </PressableButton>
    );
  };

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        flexGrow: isTablet ? undefined : 1,
        paddingHorizontal: 12,
        paddingRight: 0,
        alignItems: "center",
        justifyContent: isTablet ? "center" : "space-between"
      }}
    >
      {Object.keys(DefaultColors).map(_renderColor)}
    </View>
  );
};
