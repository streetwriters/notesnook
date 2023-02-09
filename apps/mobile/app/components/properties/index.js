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

import { getUpcomingReminder } from "@notesnook/core/collections/reminders";
import React from "react";
import { Platform, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { presentSheet } from "../../services/event-manager";
import SearchService from "../../services/search";
import { useThemeStore } from "../../stores/use-theme-store";
import { COLORS_NOTE } from "../../utils/color-scheme";
import { SIZE } from "../../utils/size";
import SheetProvider from "../sheet-provider";
import { ReminderTime } from "../ui/reminder-time";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { DateMeta } from "./date-meta";
import { DevMode } from "./dev-mode";
import { Items } from "./items";
import Notebooks from "./notebooks";
import { Synced } from "./synced";
import { Tags, TagStrip } from "./tags";

const Line = ({ top = 6, bottom = 6 }) => {
  const colors = useThemeStore((state) => state.colors);
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.nav,
        width: "100%",
        marginTop: top,
        marginBottom: bottom
      }}
    />
  );
};

export const Properties = ({
  close = () => {},
  item,
  buttons = [],
  getRef
}) => {
  const colors = useThemeStore((state) => state.colors);
  const alias = item.alias || item.title;
  const isColor = !!COLORS_NOTE[item.title];

  const onScrollEnd = () => {
    getRef().current?.handleChildScrollEnd();
  };

  if (!item || !item.id) {
    return (
      <Paragraph style={{ marginVertical: 10, alignSelf: "center" }}>
        Start writing to save your note.
      </Paragraph>
    );
  }
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
      <View
        style={{
          paddingHorizontal: 12,
          marginTop: 5,
          zIndex: 10
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

        {item.type === "note" ? <TagStrip close={close} item={item} /> : null}

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
            fontSize={SIZE.xs + 1}
          />
        ) : null}
      </View>
      <Line top={12} />

      <DateMeta item={item} />
      <Line bottom={0} />
      {item.type === "note" ? <Tags close={close} item={item} /> : null}

      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        {item.notebooks ? <Notebooks note={item} close={close} /> : null}
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
      <DevMode item={item} />

      {DDS.isTab ? (
        <View
          style={{
            height: 20
          }}
        />
      ) : null}
      <SheetProvider context="properties" />
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
      props.push(["edit-notebook", "pin", "add-shortcut", "trash"]);
      break;
    case "topic":
      props[0] = db.notebooks
        .notebook(item.notebookId)
        .topics.topic(item.id)._topic;
      props.push(["move-notes", "edit-topic", "add-shortcut", "trash"]);
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
        getRef={() => ref}
        item={props[0]}
        buttons={props[1]}
      />
    )
  });
};
