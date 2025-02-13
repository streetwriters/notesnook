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
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useDBItem } from "../app/hooks/use-db-item";
import { useShareStore } from "./store";
import { defaultBorderRadius } from "../app/utils/size";

export const AddNotebooks = ({ onPress }) => {
  const { colors } = useThemeColors();
  const notebookIds = useShareStore((state) => state.selectedNotebooks);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 12,
        width: "100%",
        marginRight: 0,
        borderWidth: 1,
        borderColor: colors.secondary.background,
        justifyContent: "center",
        borderRadius: defaultBorderRadius,
        marginBottom: 10,
        paddingVertical: 10,
        paddingTop: 5
      }}
    >
      {!notebookIds || !notebookIds.length ? (
        <>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              marginTop: 5
            }}
          >
            <Icon
              name="notebook-outline"
              size={20}
              style={{
                marginRight: 10
              }}
              color={colors.secondary.icon}
            />
            <Text
              style={{
                color: colors.secondary.icon,
                fontSize: 15
              }}
            >
              Add to notebook
            </Text>
          </View>
        </>
      ) : (
        <View
          style={{
            flexWrap: "wrap",
            width: "100%",
            flexDirection: "row"
          }}
        >
          {notebookIds.map((id) => (
            <NotebookItem key={id} id={id} />
          ))}

          <Text
            style={{
              color: colors.primary.accent,
              marginRight: 5,
              fontSize: 14,
              borderRadius: 4,
              paddingHorizontal: 8,
              backgroundColor: colors.secondary.background,
              paddingVertical: 5,
              marginTop: 5
            }}
            onPress={() => {
              onPress();
            }}
            key="$add-more"
          >
            <Icon name="plus" size={16} /> Add more
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const NotebookItem = ({ id }) => {
  const { colors } = useThemeColors();
  const [item] = useDBItem(id, "notebook");
  const notebookIds = useShareStore((state) => state.selectedNotebooks);

  return !item ? null : (
    <Text
      style={{
        color: colors.secondary.icon,
        marginRight: 5,
        fontSize: 14,
        borderRadius: 4,
        paddingHorizontal: 8,
        backgroundColor: colors.secondary.background,
        paddingVertical: 5,
        marginTop: 5
      }}
      onPress={() => {
        const index = notebookIds.indexOf(id);
        const selectedNotebooks = [...notebookIds];
        selectedNotebooks.splice(index, 1);
        useShareStore.getState().setSelectedNotebooks(selectedNotebooks);
      }}
      key={item.id}
    >
      <Icon name={"notebook-outline"} size={15} /> {item.title}
    </Text>
  );
};
