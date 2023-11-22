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
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";

export default function Notebooks({ note, close, full }) {
  const { colors } = useThemeColors();
  async function getNotebooks(item) {
    let filteredNotebooks = [];
    const relations = await db.relations.to(note, "notebook").resolve();
    filteredNotebooks.push(relations);
    if (!item.notebooks || item.notebooks.length < 1) return filteredNotebooks;
    return filteredNotebooks;
  }
  const [noteNotebooks, setNoteNotebooks] = useState([]);
  useEffect(() => {
    getNotebooks().then((notebooks) => setNoteNotebooks(notebooks));
  });

  const navigateNotebook = (id) => {
    let item = db.notebooks.notebook(id)?.data;
    if (!item) return;
    NotebookScreen.navigate(item, true);
  };

  const renderItem = (item) => (
    <View
      key={item.id}
      style={{
        justifyContent: "flex-start",
        paddingHorizontal: 12,
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 1,
        flexGrow: 1,
        padding: 6,
        borderWidth: full ? 0 : 1,
        borderColor: colors.primary.background,
        borderRadius: 10,
        backgroundColor: full ? "transparent" : colors.secondary.background,
        minHeight: 42
      }}
    >
      <Icon
        name="book-outline"
        color={colors.primary.accent}
        size={SIZE.sm}
        style={{
          marginRight: 5
        }}
      />
      <Heading
        numberOfLines={1}
        style={{
          maxWidth: "50%"
        }}
        size={SIZE.sm}
        onPress={() => {
          navigateNotebook(item.id);
          eSendEvent(eClearEditor);
          close();
        }}
      >
        {item.title}
      </Heading>
    </View>
  );

  return noteNotebooks.length === 0 ? null : (
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
          title={`See all linked notebooks`}
          fontSize={SIZE.xs}
          style={{
            alignSelf: "flex-end",
            marginRight: 12,
            paddingHorizontal: 0,
            backgroundColor: "transparent"
          }}
          type="gray"
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
  );
}
