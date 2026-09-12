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
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import {
  eSendEvent,
  presentSheet,
  sendItemUpdateEvent,
  ToastManager
} from "../../services/event-manager";
import { eOnLoadNote, refreshNotesPage } from "../../utils/events";
import { fluidTabsRef } from "../../utils/global-refs";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import SheetProvider from "../sheet-provider";
import { IconButton } from "../ui/icon-button";
import { Pressable } from "../ui/pressable";
import { ReminderTime } from "../ui/reminder-time";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { DateMeta } from "./date-meta";
import { Items } from "./items";
import { Tags } from "./tags";
import { Dialog } from "../dialog";
import AppIcon from "../ui/AppIcon";
import { Spacing } from "../../common/design/spacing";
import { Button } from "../ui/button";
import ManageTags from "../../screens/manage-tags";
import ColorPicker from "../dialogs/color-picker";
import { useRelationStore } from "../../stores/use-relation-store";
import { useMenuStore } from "../../stores/use-menu-store";
import Navigation from "../../services/navigation";
import { useIsFeatureAvailable } from "@notesnook/common";
import PaywallSheet from "../sheets/paywall";
import { useSettingStore } from "../../stores/use-setting-store";
import { Action, useActions } from "../../hooks/use-actions";
import {
  Color,
  Note,
  Notebook,
  Reminder,
  Tag,
  TrashItem
} from "@notesnook/core";
import LineSeparator from "../ui/seperator/line-separator";

export type PropertiesItem =
  | Note
  | Notebook
  | Tag
  | Color
  | Reminder
  | TrashItem;

export const Properties = ({
  close,
  item,
  buttons = []
}: {
  close?: (ctx?: string | undefined) => void;
  item: PropertiesItem;
  buttons: Action[];
}) => {
  const { colors } = useThemeColors();
  const colorFeature = useIsFeatureAvailable("colors");
  const [noteNotebooks, setNoteNotebooks] = useState<Notebook[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [visible, setVisible] = useState(false);
  const colorNotes = useMenuStore((state) => state.colorNotes);
  const actions = useActions({
    item,
    close: () => {
      close?.();
    }
  });
  const editAction = actions.find(
    (action) => action.id === "edit-notebook" || action.id === "rename-tag"
  );
  useEffect(() => {
    async function getNotebooks() {
      const filteredNotebooks = await db.relations
        .to(item, "notebook")
        .resolve();
      return filteredNotebooks || [];
    }
    if (item.type === "note") {
      getNotebooks().then((notebooks) => setNoteNotebooks(notebooks));
      db.relations
        .to(item, "tag")
        .resolve()
        .then((tags) => {
          setTags(tags);
        });
    }
  }, [item]);

  if (!item || !item.id) {
    return (
      <Paragraph style={{ marginVertical: 10, alignSelf: "center" }}>
        {strings.noNotePropertiesNotice()}
      </Paragraph>
    );
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      style={{
        backgroundColor: colors.primary.background,
        borderBottomRightRadius: DDS.isLargeTablet() ? 10 : 1,
        borderBottomLeftRadius: DDS.isLargeTablet() ? 10 : 1,
        maxHeight: "100%",
        paddingTop: Spacing.LEVEL_3
      }}
      nestedScrollEnabled
      bounces={false}
    >
      <View>
        {item.type === "note" ? (
          <ColorPicker
            visible={visible}
            setVisible={setVisible}
            onColorAdded={async (color) => {
              await db.relations.to(item, "color").unlink();
              await db.relations.add(color, item);
              useRelationStore.getState().update();
              useMenuStore.getState().setColorNotes();
              Navigation.queueRoutesForUpdate();
              sendItemUpdateEvent(color.id, "color");
              eSendEvent(refreshNotesPage);
            }}
          />
        ) : null}
        <View
          style={{
            paddingHorizontal: Spacing.LEVEL_3
          }}
        >
          <View
            style={{
              gap: Spacing.LEVEL_1
            }}
          >
            {item.type === "note" && (noteNotebooks.length || tags.length) ? (
              <View
                style={{
                  flexDirection: "row",
                  gap: Spacing.LEVEL_1
                }}
              >
                {noteNotebooks?.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      borderRadius: 100,
                      paddingHorizontal: Spacing.LEVEL_1,
                      paddingVertical: 2,
                      backgroundColor: colors.secondary.background,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.LEVEL_0
                    }}
                  >
                    <AppIcon
                      name="bookmark"
                      iconFamily="notesnook"
                      size={AppFontSize.xs}
                      color={colors.secondary.icon}
                    />
                    <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
                      {item.title}
                    </Paragraph>
                  </View>
                ))}

                {tags?.map((item) =>
                  item.id ? (
                    <View
                      key={item.id}
                      style={{
                        borderRadius: 100,
                        paddingHorizontal: Spacing.LEVEL_1,
                        paddingVertical: 2,
                        backgroundColor: colors.secondary.background,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: Spacing.LEVEL_0
                      }}
                    >
                      <Paragraph
                        size={AppFontSize.xs}
                        color={colors.secondary.paragraph}
                      >
                        {item.title}
                      </Paragraph>
                    </View>
                  ) : null
                )}
              </View>
            ) : null}

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
                  gap: Spacing.LEVEL_1
                }}
              >
                {item.type === "color" ? (
                  <Pressable
                    type="accent"
                    accentColor={item.colorCode}
                    accentText={colors.static.white}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 100
                    }}
                  />
                ) : null}

                <Heading fontSize="XL">{item.title}</Heading>

                {editAction ? (
                  <IconButton
                    name="edit-pencil"
                    iconFamily="notesnook"
                    type="plain"
                    color={colors.primary.icon}
                    size={AppFontSize.md}
                    onPress={editAction.onPress}
                  />
                ) : null}
              </View>

              {item.type === "note" ? (
                <IconButton
                  name="square-out"
                  iconFamily="notesnook"
                  type="plain"
                  color={colors.primary.icon}
                  size={AppFontSize.lg}
                  style={{
                    alignSelf: "flex-start"
                  }}
                  onPress={() => {
                    close?.();
                    eSendEvent(eOnLoadNote, {
                      item: item,
                      newTab: true
                    });
                    if (!DDS.isTab) {
                      fluidTabsRef.current?.goToPage("editor");
                    }
                  }}
                />
              ) : null}
            </View>

            {(item.type === "notebook" || item.type === "reminder") &&
            item.description ? (
              <Paragraph>{item.description}</Paragraph>
            ) : null}

            {item.type === "reminder" ? (
              <ReminderTime
                reminder={item}
                style={{
                  justifyContent: "flex-start",
                  borderWidth: 0,
                  alignSelf: "flex-start",
                  backgroundColor: "transparent",
                  paddingHorizontal: 0,
                  paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL
                }}
                fontSize={AppFontSize.xs}
              />
            ) : null}
          </View>
          {item.type === "note" ? (
            <LineSeparator paddingVertical={Spacing.LEVEL_3} />
          ) : null}
          <DateMeta item={item} />.
          {item.type === "note" && colorNotes.length > 0 ? (
            <View>
              <LineSeparator
                paddingVertical={Spacing.LEVEL_3}
                style={{
                  paddingTop: Spacing.LEVEL_2
                }}
              />
              <Tags close={close} item={item} />
              <LineSeparator
                paddingVertical={Spacing.LEVEL_3}
                style={{
                  paddingBottom: 0
                }}
              />
            </View>
          ) : null}
          {item.type === "note" ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  gap: Spacing.LEVEL_2,
                  marginTop: Spacing.LEVEL_2
                }}
              >
                <Button
                  onPress={async () => {
                    ManageTags.present([item.id]);
                    close?.();
                  }}
                  title={
                    colorNotes?.length
                      ? strings.addTag()
                      : strings.dataTypesCamelCase.tag()
                  }
                  type={colorNotes?.length ? "accent-outline" : "shade-plain"}
                  icon="plus"
                  iconFamily="notesnook"
                  style={{
                    paddingHorizontal: Spacing.LEVEL_3,
                    paddingVertical: Spacing.LEVEL_2,
                    width: colorNotes?.length > 0 ? "100%" : "48.5%"
                  }}
                />

                {colorNotes.length > 0 ? null : (
                  <Button
                    onPress={() => {
                      if (colorFeature && !colorFeature.isAllowed) {
                        ToastManager.show({
                          message: colorFeature.error,
                          type: "info",
                          context: "local",
                          actionText: strings.upgrade(),
                          func: () => {
                            PaywallSheet.present(colorFeature);
                            ToastManager.hide();
                          }
                        });
                        return;
                      }
                      useSettingStore.getState().setSheetKeyboardHandler(false);
                      setVisible(true);
                    }}
                    title={strings.dataTypesCamelCase.color()}
                    type="shade-plain"
                    icon="plus"
                    iconFamily="notesnook"
                    style={{
                      width: "48.5%",
                      paddingHorizontal: Spacing.LEVEL_3,
                      paddingVertical: Spacing.LEVEL_2
                    }}
                  />
                )}
              </View>
            </>
          ) : null}
        </View>

        <LineSeparator
          paddingVertical={Spacing.LEVEL_2}
          paddingHorizontal={Spacing.LEVEL_3}
        />

        <Items
          item={item}
          buttons={buttons}
          actions={actions}
          close={() => {
            close?.();
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
        <Dialog context="properties" />
      </View>
    </ScrollView>
  );
};

Properties.present = async (
  item: PropertiesItem,
  isSheet: boolean = false,
  buttons: Action[] = []
) => {
  if (!item) return;
  const type = item?.type;
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

  if (!dbItem) return;

  presentSheet({
    context: isSheet ? "local" : undefined,
    component: (ref, close) => (
      <Properties close={close} item={dbItem} buttons={buttons} />
    )
  });
};
