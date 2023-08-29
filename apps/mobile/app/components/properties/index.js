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
import { presentSheet } from "../../services/event-manager";
import SearchService from "../../services/search";
import { ColorValues } from "../../utils/colors";
import { SIZE } from "../../utils/size";
import SheetProvider from "../sheet-provider";
import { ReminderTime } from "../ui/reminder-time";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { DateMeta } from "./date-meta";
import { Items } from "./items";
import Notebooks from "./notebooks";
import { Synced } from "./synced";
import { TagStrip, Tags } from "./tags";
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
        Start writing to save your note.
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
      data={[0]}
      keyExtractor={() => "properties-scroll-item"}
      renderItem={() => (
        <View>
          <View
            style={{
              paddingHorizontal: 12,
              marginTop: 5,
              zIndex: 10,
              marginBottom: 6
            }}
          >
            <Heading size={SIZE.lg}>
              {item.type === "tag" && !isColor ? (
                <Heading size={SIZE.xl} color={colors.primary.accent}>
                  #
                </Heading>
              ) : null}
              {item.title}
            </Heading>

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
          {item.type === "note" ? <Tags close={close} item={item} /> : null}

          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            <Notebooks note={item} close={close} />
          </View>

          <Items
            item={item}
            buttons={buttons}
            close={() => {
              close();
              setTimeout(() => {
                SearchService.updateAndSearch();
              }, 1000);
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

Properties.present = (item, buttons = [], isSheet) => {
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
      props[0] = db.notes.note(item.id).data;
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
        "remove-from-topic",
        "remove-from-notebook",
        "history",
        "read-only",
        "reminders",
        "local-only",
        "duplicate",
        ...android,
        ...buttons
      ]);
      break;
    case "notebook":
      props[0] = db.notebooks.notebook(item.id).data;
      props.push([
        "edit-notebook",
        "pin",
        "add-shortcut",
        "trash",
        "default-notebook"
      ]);
      break;
    case "topic":
      props[0] = db.notebooks
        .notebook(item.notebookId)
        .topics.topic(item.id)._topic;
      props.push([
        "move-notes",
        "edit-topic",
        "add-shortcut",
        "trash",
        "default-topic"
      ]);
      break;
    case "tag":
      props[0] = db.tags.tag(item.id);
      props.push(["add-shortcut", "trash", "rename-tag"]);
      break;
    case "reminder": {
      props[0] = db.reminders.reminder(item.id);
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
