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

import React, { useEffect, useRef, useState } from "react";
import { TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useThemeColors } from "@notesnook/theme";
import { useSettingStore } from "../../../stores/use-setting-store";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  presentSheet
} from "../../../services/event-manager";
import SettingsService from "../../../services/settings";
import { GROUP } from "../../../utils/constants";
import { ColorValues } from "../../../utils/colors";
import { db } from "../../../common/database";
import { eOpenJumpToDialog } from "../../../utils/events";
import { SIZE } from "../../../utils/size";
import { IconButton } from "../../ui/icon-button";
import { Button } from "../../ui/button";
import Sort from "../../sheets/sort";
import Heading from "../../ui/typography/heading";
import { useCallback } from "react";

export const SectionHeader = React.memo(
  function SectionHeader({ item, index, type, color, screen }) {
    const { colors } = useThemeColors();
    const { fontScale } = useWindowDimensions();
    const [groupOptions, setGroupOptions] = useState(
      db.settings?.getGroupOptions(type)
    );
    let groupBy = Object.keys(GROUP).find(
      (key) => GROUP[key] === groupOptions.groupBy
    );
    const jumpToRef = useRef();
    const sortRef = useRef();
    const compactModeRef = useRef();

    const notebooksListMode = useSettingStore(
      (state) => state.settings.notebooksListMode
    );
    const notesListMode = useSettingStore(
      (state) => state.settings.notesListMode
    );
    const listMode = type === "notebooks" ? notebooksListMode : notesListMode;

    groupBy = !groupBy
      ? "Default"
      : groupBy.slice(0, 1).toUpperCase() + groupBy.slice(1, groupBy.length);

    const onUpdate = useCallback(() => {
      setGroupOptions({ ...db.settings?.getGroupOptions(type) });
    }, [type]);

    useEffect(() => {
      eSubscribeEvent("groupOptionsUpdate", onUpdate);
      return () => {
        eUnSubscribeEvent("groupOptionsUpdate", onUpdate);
      };
    }, [onUpdate]);

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "95%",
          justifyContent: "space-between",
          paddingHorizontal: 12,
          height: 35 * fontScale,
          backgroundColor: colors.secondary.background,
          alignSelf: "center",
          borderRadius: 5,
          marginVertical: 5
        }}
      >
        <TouchableOpacity
          onPress={() => {
            eSendEvent(eOpenJumpToDialog, type);
          }}
          ref={jumpToRef}
          activeOpacity={0.9}
          hitSlop={{ top: 10, left: 10, right: 30, bottom: 15 }}
          style={{
            height: "100%",
            justifyContent: "center"
          }}
        >
          <Heading
            color={ColorValues[color?.toLowerCase()] || colors.primary.accent}
            size={SIZE.sm}
            style={{
              minWidth: 60,
              alignSelf: "center",
              textAlignVertical: "center"
            }}
          >
            {!item.title || item.title === "" ? "Pinned" : item.title}
          </Heading>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center"
          }}
        >
          {index === 0 && (
            <>
              <Button
                onPress={() => {
                  presentSheet({
                    component: <Sort screen={screen} type={type} />
                  });
                }}
                hidden={screen === "Reminders"}
                tooltipText="Change sorting of items in list"
                fwdRef={sortRef}
                title={groupBy}
                icon={
                  groupOptions.sortDirection === "asc"
                    ? "sort-ascending"
                    : "sort-descending"
                }
                height={25}
                style={{
                  borderRadius: 100,
                  paddingHorizontal: 0,
                  backgroundColor: "transparent",
                  marginRight:
                    type === "notes" || type === "home" || type === "notebooks"
                      ? 10
                      : 0
                }}
                type="gray"
                iconPosition="right"
              />

              <IconButton
                customStyle={{
                  width: 25,
                  height: 25
                }}
                hidden={
                  type !== "notes" && type !== "notebooks" && type !== "home"
                }
                testID="icon-compact-mode"
                tooltipText={
                  listMode == "compact"
                    ? "Switch to normal mode"
                    : "Switch to compact mode"
                }
                fwdRef={compactModeRef}
                color={colors.secondary.icon}
                name={listMode == "compact" ? "view-list" : "view-list-outline"}
                onPress={() => {
                  let settings = {};
                  settings[
                    type !== "notebooks" ? "notesListMode" : "notebooksListMode"
                  ] = listMode === "normal" ? "compact" : "normal";

                  SettingsService.set(settings);
                }}
                size={SIZE.lg - 2}
              />
            </>
          )}
        </View>
      </View>
    );
  },
  (prev, next) => {
    if (prev.item.title !== next.item.title) return false;

    return true;
  }
);
