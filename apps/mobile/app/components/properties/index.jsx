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
import { FlatList } from "react-native-actions-sheet";
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

export const Properties = ({ close = () => {}, item, buttons = [] }) => {
  const { colors } = useThemeColors();
  const colorFeature = useIsFeatureAvailable("colors");
  const [noteNotebooks, setNoteNotebooks] = useState([]);
  const [tags, setTags] = useState([]);
  const [visible, setVisible] = useState(false);
  const colorNotes = useMenuStore((state) => state.colorNotes);
  useEffect(() => {
    async function getNotebooks() {
      let filteredNotebooks = await db.relations.to(item, "notebook").resolve();
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
    <FlatList
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
      data={[0]}
      keyExtractor={() => "properties-scroll-item"}
      renderItem={() => (
        <View
          style={{
            gap: Spacing.LEVEL_1
          }}
        >
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
            <View>
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
                  ) : item.type === "tag" ? (
                    <AppIcon
                      name="shopping-mode"
                      iconFamily="evilicons"
                      size={AppFontSize.lg}
                      color={colors.primary.icon}
                    />
                  ) : null}

                  <Heading size={AppFontSize.xl}>{item.title}</Heading>
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
                      close();
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

            <DateMeta item={item} />

            {item.type === "note" && colorNotes.length > 0 ? (
              <Tags close={close} item={item} />
            ) : null}

            <View
              style={{
                flexDirection: "row",
                borderBottomWidth: 1,
                borderTopWidth: colorNotes.length > 0 ? 1 : 0,
                borderColor: colors.primary.border,
                paddingVertical: Spacing.LEVEL_2,
                paddingTop: colorNotes.length > 0 ? Spacing.LEVEL_2 : 0,
                gap: Spacing.LEVEL_2
              }}
            >
              <Button
                onPress={async () => {
                  ManageTags.present([item.id]);
                  close();
                }}
                buttonType={{
                  text: colors.primary.paragraph
                }}
                title={strings.addTag()}
                type={colorNotes?.length ? "accent-outline" : "shade"}
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
                  title={strings.addColor()}
                  type="secondaryAccented"
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
          </View>

          {/* {item.type === "note" ? (
            <Notebooks note={item} close={close} />
          ) : null} */}
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
          <Dialog context="properties" />
        </View>
      )}
    />
  );
};

Properties.present = async (item, isSheet, buttons = []) => {
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
      <Properties
        close={close}
        actionSheetRef={ref}
        item={dbItem}
        buttons={buttons}
      />
    )
  });
};
