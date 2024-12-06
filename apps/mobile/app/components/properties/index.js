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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { FlatList } from "react-native-actions-sheet";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { eSendEvent, presentSheet } from "../../services/event-manager";
import { ColorValues } from "../../utils/colors";
import { eOnLoadNote } from "../../utils/events";
import { fluidTabsRef } from "../../utils/global-refs";
import { SIZE } from "../../utils/size";
import SheetProvider from "../sheet-provider";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import { ReminderTime } from "../ui/reminder-time";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { DateMeta } from "./date-meta";
import { Items } from "./items";
import Notebooks from "./notebooks";
import { TagStrip, Tags } from "./tags";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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
                  flexShrink: 1,
                  gap: 5
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
                ) : item.type === "tag" ? (
                  <Icon
                    name="pound"
                    size={SIZE.lg}
                    color={colors.primary.icon}
                  />
                ) : null}

                <Heading size={SIZE.lg}>{item.title}</Heading>
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
                      fluidTabsRef.current?.goToPage(1);
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

Properties.present = async (item, isSheet) => {
  if (!item) return;
  let type = item?.type;
  let dbItem;
  switch (type) {
    case "trash":
      dbItem = item;
      break;
    case "note":
      dbItem = await db.notes.note(item.id);
      break;
    case "notebook":
      dbItem = await db.notebooks.notebook(item.id);
      break;
    case "tag":
      dbItem = await db.tags.tag(item.id);
      break;
    case "color":
      dbItem = await db.colors.color(item.id);
      break;
    case "reminder": {
      dbItem = await db.reminders.reminder(item.id);
      break;
    }
  }

  presentSheet({
    context: isSheet ? "local" : undefined,
    component: (ref, close) => (
      <Properties close={close} actionSheetRef={ref} item={dbItem} />
    )
  });
};
