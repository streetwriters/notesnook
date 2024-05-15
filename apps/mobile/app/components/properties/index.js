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
import { Platform, View } from "react-native";
import { FlatList } from "react-native-actions-sheet";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { eSendEvent, presentSheet } from "../../services/event-manager";
import { ColorValues } from "../../utils/colors";
import { eOnLoadNote } from "../../utils/events";
import { SIZE } from "../../utils/size";
import SheetProvider from "../sheet-provider";
import { useSideBarDraggingStore } from "../side-menu/dragging-store";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import { ReminderTime } from "../ui/reminder-time";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { DateMeta } from "./date-meta";
import { Items } from "./items";
import Notebooks from "./notebooks";
import { Synced } from "./synced";
import { TagStrip, Tags } from "./tags";
import { tabBarRef } from "../../utils/global-refs";
import { strings } from "@notesnook/intl";

const Line = ({ top = 6, bottom = 6 }) => {
  const { colors } = useThemeColors();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.primary.border,
        width: "100%",
        marginTop: top,
        marginBottom: bottom
      }}
    />
  );
};

export const Properties = ({ close = () => {}, item, buttons = [] }) => {
  const { colors } = useThemeColors();
  const isColor = !!ColorValues[item.title];
  if (!item || !item.id) {
    return (
      <Paragraph style={{ marginVertical: 10, alignSelf: "center" }}>
        {strings.noNotePropertiesNotice()}
      </Paragraph>
    );
  }

  return (
    <FlatList
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      style={{
        backgroundColor: colors.primary.background,
        borderBottomRightRadius: DDS.isLargeTablet() ? 10 : 1,
        borderBottomLeftRadius: DDS.isLargeTablet() ? 10 : 1,
        maxHeight: "100%"
      }}
      nestedScrollEnabled
      bounces={false}
      data={[0]}
      keyExtractor={() => "properties-scroll-item"}
      renderItem={() => (
        <View>
          <View
            style={{
              paddingHorizontal: 12,
              marginTop: 5,
              zIndex: 10,
              marginBottom: 5
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between"
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  flexShrink: 1
                }}
              >
                {item.type === "color" ? (
                  <Pressable
                    type="accent"
                    accentColor={item.colorCode}
                    accentText={colors.static.white}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 100,
                      marginRight: 10
                    }}
                  />
                ) : null}

                <Heading size={SIZE.lg}>
                  {item.type === "tag" && !isColor ? (
                    <Heading size={SIZE.xl} color={colors.primary.accent}>
                      #
                    </Heading>
                  ) : null}
                  {item.title}
                </Heading>
              </View>

              {item.type === "note" ? (
                <IconButton
                  name="open-in-new"
                  type="plain"
                  color={colors.primary.icon}
                  size={SIZE.lg}
                  style={{
                    alignSelf: "flex-start"
                  }}
                  onPress={() => {
                    close();
                    eSendEvent(eOnLoadNote, {
                      item: item,
                      newTab: true
                    });
                    if (!DDS.isTab) {
                      tabBarRef.current?.goToPage(1);
                    }
                  }}
                />
              ) : null}
            </View>

            {item.type === "notebook" && item.description ? (
              <Paragraph>{item.description}</Paragraph>
            ) : null}

            {item.type === "note" ? (
              <TagStrip close={close} item={item} />
            ) : null}

            {item.type === "reminder" ? (
              <ReminderTime
                reminder={item}
                style={{
                  justifyContent: "flex-start",
                  borderWidth: 0,
                  height: 30,
                  alignSelf: "flex-start",
                  backgroundColor: "transparent",
                  paddingHorizontal: 0
                }}
                fontSize={SIZE.xs}
              />
            ) : null}
          </View>

          <DateMeta item={item} />
          <Line bottom={0} />

          {item.type === "note" ? (
            <>
              <Tags close={close} item={item} />
              <Line bottom={0} />
            </>
          ) : null}
          {item.type === "note" ? (
            <View
              style={{
                paddingHorizontal: 12
              }}
            >
              <Notebooks note={item} close={close} />
            </View>
          ) : null}

          <Items
            item={item}
            buttons={buttons}
            close={() => {
              close();
            }}
          />

          <Synced item={item} close={close} />

          {DDS.isTab ? (
            <View
              style={{
                height: 20
              }}
            />
          ) : null}
          <SheetProvider context="properties" />
        </View>
      )}
    />
  );
};

Properties.present = async (item, buttons = [], isSheet) => {
  if (!item) return;
  let type = item?.type;
  let props = [];
  let android = [];
  switch (type) {
    case "trash":
      props[0] = item;
      props.push(["delete", "restore"]);
      break;
    case "note":
      android = Platform.OS === "android" ? ["pin-to-notifications"] : [];
      props[0] = await db.notes.note(item.id);
      props.push([
        "notebooks",
        "add-reminder",
        "share",
        "export",
        "copy",
        "publish",
        "pin",
        "favorite",
        "attachments",
        "lock-unlock",
        "trash",
        "remove-from-notebook",
        "history",
        "read-only",
        "reminders",
        "local-only",
        "duplicate",
        "copy-link",
        "references",
        ...android,
        ...buttons
      ]);
      break;
    case "notebook":
      props[0] = await db.notebooks.notebook(item.id);
      props.push([
        "edit-notebook",
        "pin",
        "add-shortcut",
        "trash",
        "default-notebook",
        "add-notebook",
        "move-notes",
        "move-notebook"
      ]);
      break;
    case "tag":
      props[0] = await db.tags.tag(item.id);
      props.push(["add-shortcut", "trash", "rename-tag"]);
      break;
    case "color":
      props[0] = await db.colors.color(item.id);

      props.push([
        "trash",
        "rename-color",
        ...(useSideBarDraggingStore.getState().dragging ? [] : ["reorder"])
      ]);
      break;
    case "reminder": {
      props[0] = await db.reminders.reminder(item.id);
      props.push(["edit-reminder", "trash", "disable-reminder"]);
      break;
    }
  }
  if (!props[0]) return;
  presentSheet({
    context: isSheet ? "local" : undefined,
    component: (ref, close) => (
      <Properties
        close={() => {
          close();
        }}
        actionSheetRef={ref}
        item={props[0]}
        buttons={props[1]}
      />
    )
  });
};
