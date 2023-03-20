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

import React from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { TaggedNotes } from "../../screens/notes/tagged";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import { sleep } from "../../utils/time";
import ManageTagsSheet from "../sheets/manage-tags";
import { Button } from "../ui/button";
import { ColorTags } from "./color-tags";
export const Tags = ({ item, close }) => {
  const colors = useThemeStore((state) => state.colors);

  return item.id ? (
    <View
      style={{
        marginTop: 5,
        paddingTop: 6,
        paddingBottom: 6,
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        paddingHorizontal: 12,
        alignSelf: "center",
        justifyContent: "space-between",
        width: "100%"
      }}
    >
      <Button
        onPress={async () => {
          ManageTagsSheet.present(item);
        }}
        buttonType={{
          text: colors.accent
        }}
        title="Add tags"
        type="grayBg"
        icon="plus"
        iconPosition="right"
        height={30}
        fontSize={SIZE.xs + 1}
        style={{
          marginRight: 5,
          borderRadius: 100,
          paddingHorizontal: 8
        }}
      />
      <ColorTags item={item} />
    </View>
  ) : null;
};

export const TagStrip = ({ item, close }) => {
  return item.tags?.length > 0 ? (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center"
      }}
    >
      {item.tags.map((tag) =>
        tag ? <TagItem key={tag} tag={tag} close={close} /> : null
      )}
    </View>
  ) : null;
};

const TagItem = ({ tag, close }) => {
  const onPress = async () => {
    let tags = db.tags.all;
    let _tag = tags.find((t) => t.title === tag);
    TaggedNotes.navigate(_tag, true);
    await sleep(300);
    close();
  };

  const style = {
    paddingHorizontal: 0,
    borderRadius: 100,
    marginRight: 10,
    marginTop: 0,
    backgroundColor: "transparent"
  };
  return (
    <Button
      onPress={onPress}
      title={"#" + tag}
      type="grayBg"
      height={20}
      fontSize={SIZE.xs + 1}
      style={style}
      textStyle={{
        textDecorationLine: "underline"
      }}
    />
  );
};
