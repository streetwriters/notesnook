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
import { db } from "../../common/database";
import { TaggedNotes } from "../../screens/notes/tagged";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
import { ColorTags } from "./color-tags";
import { Spacing } from "../../common/design/spacing";

export const Tags = ({ item, close }) => {
  const { colors } = useThemeColors();

  return item.id ? (
    <View
      style={{
        flexDirection: "row",
        width: "100%"
      }}
    >
      <ColorTags item={item} />
    </View>
  ) : null;
};

export const TagStrip = ({ item, close }) => {
  const [tags, setTags] = useState([]);
  useEffect(() => {
    db.relations
      .to(item, "tag")
      .resolve()
      .then((tags) => {
        setTags(tags);
      });
  }, [item]);

  return tags?.length > 0 ? (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 5
      }}
    >
      {tags?.map((tag) =>
        tag ? <TagItem key={tag.id} tag={tag} close={close} /> : null
      )}
    </View>
  ) : null;
};

const TagItem = ({ tag, close }) => {
  const { colors } = useThemeColors();
  const onPress = async () => {
    TaggedNotes.navigate(tag, true);
    await sleep(300);
    close();
  };

  const style = {
    paddingHorizontal: 0,
    paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL
  };
  return (
    <Button
      onPress={onPress}
      title={"#" + tag.title}
      type="plain"
      fontSize={AppFontSize.xs}
      style={style}
      textStyle={{
        color: colors.secondary.paragraph
      }}
    />
  );
};
