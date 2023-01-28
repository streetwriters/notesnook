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

import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { db } from "../../common/database";
import Notebook from "../../screens/notebook";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import useNavigationStore from "../../stores/use-navigation-store";
import { useThemeColors } from "@notesnook/theme";
import { eScrollEvent } from "../../utils/events";
import { SIZE } from "../../utils/size";
import Heading from "../ui/typography/heading";
import { useCallback } from "react";
import Tag from "../ui/tag";

const titleState = {};

export const Title = () => {
  const colors = useThemeColors();
  const currentScreen = useNavigationStore((state) => state.currentScreen);
  const isNotebook = currentScreen.name === "Notebook";
  const isTopic = currentScreen?.name === "TopicNotes";
  const [hide, setHide] = useState(
    isNotebook
      ? typeof titleState[currentScreen.id] === "boolean"
        ? titleState[currentScreen.id]
        : true
      : false
  );
  const isHidden = titleState[currentScreen.id];
  const notebook =
    isTopic && currentScreen.notebookId
      ? db.notebooks?.notebook(currentScreen.notebookId)?.data
      : null;
  const title = currentScreen.title;
  const isTag = currentScreen?.name === "TaggedNotes";

  const onScroll = useCallback(
    (data) => {
      if (currentScreen.name !== "Notebook") {
        setHide(false);
        return;
      }
      if (data.y > 150) {
        if (!hide) return;
        titleState[currentScreen.id] = false;
        setHide(false);
      } else {
        if (hide) return;
        titleState[currentScreen.id] = true;
        setHide(true);
      }
    },
    [currentScreen.id, currentScreen.name, hide]
  );

  useEffect(() => {
    if (currentScreen.name === "Notebook") {
      let value =
        typeof titleState[currentScreen.id] === "boolean"
          ? titleState[currentScreen.id]
          : true;
      setHide(value);
    } else {
      setHide(titleState[currentScreen.id]);
    }
  }, [currentScreen.id, currentScreen.name]);

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, [hide, onScroll]);

  function navigateToNotebook() {
    if (!isTopic) return;
    Notebook.navigate(notebook, true);
  }
  return (
    <View
      style={{
        opacity: 1,
        flexShrink: 1,
        flexDirection: "row",
        alignItems: "center"
      }}
    >
      {!hide && !isHidden ? (
        <Heading
          onPress={navigateToNotebook}
          numberOfLines={1}
          size={SIZE.xl}
          style={{
            flexWrap: "wrap",
            marginTop: Platform.OS === "ios" ? -1 : 0
          }}
          color={currentScreen.color || colors.primary.heading}
        >
          {isTag ? (
            <Heading size={SIZE.xl} color={colors.primary.accent}>
              #
            </Heading>
          ) : null}
          {title}
        </Heading>
      ) : null}
      <Tag visible={currentScreen.beta} text="BETA" />
    </View>
  );
};
