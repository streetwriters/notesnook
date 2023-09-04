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
import React, { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { db } from "../../common/database";
import Notebook from "../../screens/notebook";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import useNavigationStore from "../../stores/use-navigation-store";
import { eScrollEvent } from "../../utils/events";
import { SIZE } from "../../utils/size";
import Tag from "../ui/tag";
import Heading from "../ui/typography/heading";

const titleState: { [name: string]: boolean } = {};

export const Title = () => {
  const { colors } = useThemeColors();
  const currentScreen = useNavigationStore((state) => state.currentScreen);
  const isNotebook = currentScreen.name === "Notebook";
  const isTopic = currentScreen?.name === "TopicNotes";
  const [hide, setHide] = useState(
    isNotebook
      ? typeof titleState[currentScreen.id as string] === "boolean"
        ? titleState[currentScreen.id as string]
        : true
      : false
  );
  const isHidden = titleState[currentScreen.id as string];
  const notebook =
    isTopic && currentScreen.notebookId
      ? db.notebooks?.notebook(currentScreen.notebookId)?.data
      : null;
  const title = currentScreen.title;
  const isTag = currentScreen?.name === "TaggedNotes";

  const onScroll = useCallback(
    (data: { x: number; y: number }) => {
      if (currentScreen.name !== "Notebook") {
        setHide(false);
        return;
      }
      if (data.y > 150) {
        if (!hide) return;
        titleState[currentScreen.id as string] = false;
        setHide(false);
      } else {
        if (hide) return;
        titleState[currentScreen.id as string] = true;
        setHide(true);
      }
    },
    [currentScreen.id, currentScreen.name, hide]
  );

  useEffect(() => {
    if (currentScreen.name === "Notebook") {
      const value =
        typeof titleState[currentScreen.id as string] === "boolean"
          ? titleState[currentScreen.id as string]
          : true;
      setHide(value);
    } else {
      setHide(titleState[currentScreen.id as string]);
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
    <>
      {!hide && !isHidden ? (
        <Heading
          onPress={navigateToNotebook}
          numberOfLines={1}
          size={SIZE.lg}
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
          {title} <Tag visible={currentScreen.beta} text="BETA" />
        </Heading>
      ) : null}
    </>
  );
};
