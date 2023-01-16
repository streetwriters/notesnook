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
import { TopicNotes } from "../../screens/notes/topic-notes";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
export const Topics = ({ item, close }) => {
  const open = (topic) => {
    close();
    TopicNotes.navigate(topic, true);
  };

  const renderItem = (topic) => (
    <Button
      key={topic.id}
      title={topic.title}
      type="grayBg"
      // buttonType={{
      //   text: colors.accent
      // }}
      height={30}
      onPress={() => open(topic)}
      icon="bookmark-outline"
      fontSize={SIZE.xs + 1}
      style={{
        marginRight: 5,
        paddingHorizontal: 8,
        borderRadius: 100,
        marginVertical: 5
      }}
    />
  );

  return item &&
    item.type === "notebook" &&
    item.topics &&
    item.topics.length > 0 ? (
    <View
      style={{
        flexDirection: "row",
        marginTop: 5,
        width: "100%",
        flexWrap: "wrap"
      }}
    >
      {item.topics
        .sort((a, b) => a.dateEdited - b.dateEdited)
        .slice(0, 6)
        .map(renderItem)}
    </View>
  ) : null;
};
