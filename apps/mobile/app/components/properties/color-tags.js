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

import React, { useState } from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../e2e/test.ids";
import { db } from "../../common/database";
import { eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useMenuStore } from "../../stores/use-menu-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { ColorValues } from "../../utils/colors";
import { refreshNotesPage } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { PressableButton } from "../ui/pressable";
import { useThemeColors } from "@notesnook/theme";

export const ColorTags = ({ item }) => {
  const { colors } = useThemeColors();
  const [note, setNote] = useState(item);
  const setColorNotes = useMenuStore((state) => state.setColorNotes);
  const isTablet = useSettingStore((state) => state.deviceMode) !== "mobile";
  const changeColor = async (color) => {
    if (note.color === color.name) {
      await db.notes.note(note.id).uncolor();
    } else {
      await db.notes.note(note.id).color(color.name);
    }
    let _note = db.notes.note(note.id).data;
    setNote({ ..._note });
    setColorNotes();
    Navigation.queueRoutesForUpdate();
    eSendEvent(refreshNotesPage);
  };

  const _renderColor = (c) => {
    const color = {
      name: c,
      value: ColorValues[c?.toLowerCase()]
    };

    return (
      <PressableButton
        type="accent"
        accentColor={colors.static[color.name?.toLowerCase()]}
        accentText={colors.static.white}
        testID={notesnook.ids.dialogs.actionsheet.color(c)}
        key={color.value}
        onPress={() => changeColor(color)}
        customStyle={{
          width: 30,
          height: 30,
          borderRadius: 100,
          justifyContent: "center",
          alignItems: "center",
          marginRight: isTablet ? 10 : undefined
        }}
      >
        {note.color?.toLowerCase() === color.name ? (
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
      {Object.keys(ColorValues).map(_renderColor)}
    </View>
  );
};
