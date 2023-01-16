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
import { Platform, View, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { presentSheet } from "../../services/event-manager";
import SearchService from "../../services/search";
import { useThemeStore } from "../../stores/use-theme-store";
import { COLORS_NOTE } from "../../utils/color-scheme";
import { SIZE } from "../../utils/size";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { ColorTags } from "./color-tags";
import { DateMeta } from "./date-meta";
import { DevMode } from "./dev-mode";
import { Items } from "./items";
import Notebooks from "./notebooks";
import { Synced } from "./synced";
import { Tags } from "./tags";
import { Topics } from "./topics";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  formatReminderTime,
  getUpcomingReminder
} from "@notesnook/core/collections/reminders";
import { ReminderTime } from "../ui/reminder-time";
export const Properties = ({
  close = () => {},
  item,
  buttons = [],
  getRef
}) => {
  const colors = useThemeStore((state) => state.colors);
  const alias = item.alias || item.title;
  const isColor = !!COLORS_NOTE[item.title];
  const reminders = db.relations.from(item, "reminder");
  const current = getUpcomingReminder(reminders);

  const onScrollEnd = () => {
    getRef().current?.handleChildScrollEnd();
  };

  return (
    <ScrollView
      nestedScrollEnabled
      onMomentumScrollEnd={onScrollEnd}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      style={{
        backgroundColor: colors.bg,
        paddingHorizontal: 0,
        borderBottomRightRadius: DDS.isLargeTablet() ? 10 : 1,
        borderBottomLeftRadius: DDS.isLargeTablet() ? 10 : 1,
        maxHeight: "100%"
      }}
    >
      {!item || !item.id ? (
        <Paragraph style={{ marginVertical: 10, alignSelf: "center" }}>
          Start writing to save your note.
        </Paragraph>
      ) : (
        <View
          style={{
            marginTop: 5,
            zIndex: 10
          }}
        >
          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            <Heading size={SIZE.lg}>
              {item.type === "tag" && !isColor ? (
                <Heading size={SIZE.xl} color={colors.accent}>
                  #
                </Heading>
              ) : null}
              {alias}
            </Heading>

            {item.headline || item.description ? (
              <Paragraph
                style={{
                  marginBottom: 5
                }}
                numberOfLines={2}
                color={colors.icon}
              >
                {(item.type === "notebook" ||
                  item.itemType === "notebook" ||
                  item.type === "reminder") &&
                item?.description
                  ? item.description
                  : null}
                {(item.type === "note" || item.itemType === "note") &&
                item?.headline
                  ? item.headline
                  : null}
              </Paragraph>
            ) : null}

            {item.type === "reminder" ? (
              <ReminderTime
                reminder={item}
                style={{
                  justifyContent: "flex-start",
                  borderWidth: 0,
                  height: 30,
                  alignSelf: "flex-start"
                }}
                fontSize={SIZE.xs + 1}
              />
            ) : null}

            {item.type === "note" ? <Tags close={close} item={item} /> : null}

            <Topics item={item} close={close} />
          </View>

          {item.type === "note" ? (
            <Notebooks note={item} close={close} />
          ) : null}

          <DateMeta item={item} />
        </View>
      )}

      <View
        style={{
          borderTopWidth: 1,
          borderColor: colors.nav
        }}
      />

      {item.type === "note" ? <ColorTags close={close} item={item} /> : null}

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
      <DevMode item={item} />

      {DDS.isTab ? (
        <View
          style={{
            height: 20
          }}
        />
      ) : null}
    </ScrollView>
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
      props.push(["PermDelete", "Restore"]);
      break;
    case "note":
      android = Platform.OS === "android" ? ["PinToNotif"] : [];
      props[0] = db.notes.note(item.id).data;
      props.push([
        "Add to notebook",
        "Add-Reminder",
        "Share",
        "Export",
        "Copy",
        "Publish",
        "Pin",
        "Favorite",
        "Attachments",
        "Vault",
        "Delete",
        "RemoveTopic",
        "History",
        "ReadOnly",
        "Reminders",
        "Local only",
        "Duplicate",
        ...android,
        ...buttons
      ]);
      break;
    case "notebook":
      props[0] = db.notebooks.notebook(item.id).data;
      props.push(["Edit Notebook", "Pin", "Add Shortcut", "Delete"]);
      break;
    case "topic":
      props[0] = db.notebooks
        .notebook(item.notebookId)
        .topics.topic(item.id)._topic;
      props.push(["Move notes", "Edit Topic", "Add Shortcut", "Delete"]);
      break;
    case "tag":
      props[0] = db.tags.tag(item.id);
      props.push(["Add Shortcut", "Delete", "Rename Tag"]);
      break;
    case "reminder": {
      props[0] = db.reminders.reminder(item.id);
      props.push(["Edit reminder", "Delete", "ReminderOnOff"]);
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
        getRef={() => ref}
        item={props[0]}
        buttons={props[1]}
      />
    )
  });
};
