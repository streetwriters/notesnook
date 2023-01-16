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

import { useRef, useState } from "react";
import React from "react";
import { View } from "react-native";
import { useThemeStore } from "../../../stores/use-theme-store";
import { useMenuStore } from "../../../stores/use-menu-store";
import { ToastEvent } from "../../../services/event-manager";
import { getTotalNotes } from "../../../utils";
import { db } from "../../../common/database";
import { SIZE } from "../../../utils/size";
import { IconButton } from "../../ui/icon-button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

export const NotebookHeader = ({ notebook, onEditNotebook }) => {
  const colors = useThemeStore((state) => state.colors);
  const [isPinnedToMenu, setIsPinnedToMenu] = useState(
    db.shortcuts.exists(notebook.id)
  );
  const setMenuPins = useMenuStore((state) => state.setMenuPins);
  const totalNotes = getTotalNotes(notebook);
  const shortcutRef = useRef();

  const onPinNotebook = async () => {
    try {
      if (isPinnedToMenu) {
        await db.shortcuts.remove(notebook.id);
      } else {
        await db.shortcuts.add({
          item: {
            id: notebook.id,
            type: "notebook"
          }
        });
        ToastEvent.show({
          heading: "Shortcut created",
          type: "success"
        });
      }
      setIsPinnedToMenu(db.shortcuts.exists(notebook.id));
      setMenuPins();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View
      style={{
        marginBottom: 5,
        padding: 0,
        width: "100%",
        paddingVertical: 15,
        paddingHorizontal: 12,
        alignSelf: "center",
        borderRadius: 10,
        paddingTop: 25
      }}
    >
      <Paragraph color={colors.icon} size={SIZE.xs}>
        {new Date(notebook.dateEdited).toLocaleString()}
      </Paragraph>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Heading
          style={{
            flexShrink: 1
          }}
          size={SIZE.xxl}
        >
          {notebook.title}
        </Heading>

        <View
          style={{
            flexDirection: "row"
          }}
        >
          <IconButton
            name={isPinnedToMenu ? "link-variant-off" : "link-variant"}
            onPress={onPinNotebook}
            tooltipText={"Create shortcut in side menu"}
            fwdRef={shortcutRef}
            customStyle={{
              marginRight: 15,
              width: 40,
              height: 40
            }}
            type={isPinnedToMenu ? "grayBg" : "grayBg"}
            color={isPinnedToMenu ? colors.accent : colors.icon}
            size={SIZE.lg}
          />
          <IconButton
            size={SIZE.lg}
            onPress={onEditNotebook}
            tooltipText="Edit this notebook"
            name="pencil"
            type="grayBg"
            color={colors.icon}
            customStyle={{
              width: 40,
              height: 40
            }}
          />
        </View>
      </View>

      {notebook.description ? (
        <Paragraph size={SIZE.md} color={colors.pri}>
          {notebook.description}
        </Paragraph>
      ) : null}

      <Paragraph
        style={{
          marginTop: 10,
          fontStyle: "italic",
          fontFamily: null
        }}
        size={SIZE.xs}
        color={colors.icon}
      >
        {notebook.topics.length === 1
          ? "1 topic"
          : `${notebook.topics.length} topics`}
        ,{" "}
        {notebook && totalNotes > 1
          ? totalNotes + " notes"
          : totalNotes === 1
          ? totalNotes + " note"
          : "0 notes"}
      </Paragraph>
    </View>
  );
};
