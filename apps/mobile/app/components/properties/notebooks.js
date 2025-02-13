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

import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import NotebookScreen from "../../screens/notebook";
import { eSendEvent, presentSheet } from "../../services/event-manager";
import { eClearEditor } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import { Pressable } from "../ui/pressable";
import { strings } from "@notesnook/intl";

export default function Notebooks({ note, close, full }) {
  const { colors } = useThemeColors();
  async function getNotebooks() {
    let filteredNotebooks = await db.relations.to(note, "notebook").resolve();
    return filteredNotebooks || [];
  }
  const [noteNotebooks, setNoteNotebooks] = useState([]);
  useEffect(() => {
    getNotebooks().then((notebooks) => setNoteNotebooks(notebooks));
  });

  const navigateNotebook = async (id) => {
    let item = await db.notebooks.notebook(id);
    if (!item) return;
    NotebookScreen.navigate(item, true);
  };

  const renderItem = (item) => (
    <Pressable
      key={item.id}
      onPress={() => {
        navigateNotebook(item.id);
        eSendEvent(eClearEditor);
        close();
      }}
      type={full ? "transparent" : "secondary"}
      style={{
        justifyContent: "flex-start",
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
        flexGrow: 1,
        padding: 6,
        borderRadius: 10,
        minHeight: 42
      }}
    >
      <Icon
        name="book-outline"
        color={colors.primary.accent}
        size={AppFontSize.sm}
        style={{
          marginRight: 5
        }}
      />
      <Heading
        numberOfLines={1}
        style={{
          maxWidth: "50%"
        }}
        size={AppFontSize.sm}
      >
        {item.title}
      </Heading>
    </Pressable>
  );

  return noteNotebooks.length === 0 ? null : (
    <View
      style={{
        paddingHorizontal: 12
      }}
    >
      <View
        style={{
          width: "100%",
          borderRadius: 10,
          marginTop: 6
        }}
      >
        {full
          ? noteNotebooks.map(renderItem)
          : noteNotebooks.slice(0, 1).map(renderItem)}

        {noteNotebooks.length > 1 && !full ? (
          <Button
            title={strings.viewAllLinkedNotebooks()}
            fontSize={AppFontSize.xs}
            style={{
              alignSelf: "flex-end",
              marginRight: 12,
              paddingHorizontal: 0,
              backgroundColor: "transparent"
            }}
            type="plain"
            textStyle={{
              textDecorationLine: "underline"
            }}
            height={20}
            onPress={() => {
              presentSheet({
                context: "properties",
                component: (ref, close) => (
                  <Notebooks note={note} close={close} full={true} />
                )
              });
            }}
          />
        ) : undefined}
      </View>
    </View>
  );
}
