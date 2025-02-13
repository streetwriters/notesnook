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

import { getFormattedDate } from "@notesnook/common";
import { useThemeColors } from "@notesnook/theme";
import KeepAwake from "@sayem314/react-native-keep-awake";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { db } from "../../common/database";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { ReadonlyEditor } from "../../screens/editor/readonly-editor";
import { useTabStore } from "../../screens/editor/tiptap/use-tab-store";
import { editorController } from "../../screens/editor/tiptap/utils";
import { DDS } from "../../services/device-detection";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import Navigation from "../../services/navigation";
import Sync from "../../services/sync";
import { useSettingStore } from "../../stores/use-setting-store";
import { eOnLoadNote, eShowMergeDialog } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import BaseDialog from "../dialog/base-dialog";
import DialogButtons from "../dialog/dialog-buttons";
import DialogContainer from "../dialog/dialog-container";
import DialogHeader from "../dialog/dialog-header";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Seperator from "../ui/seperator";
import Paragraph from "../ui/typography/paragraph";
import { diff } from "diffblazer";
import { strings } from "@notesnook/intl";

const MergeConflicts = () => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [keep, setKeep] = useState(null);
  const [copy, setCopy] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const insets = useGlobalSafeAreaInsets();
  const content = useRef(null);
  const isKeepingConflicted = !keep?.conflicted;
  const isKeeping = !!keep;
  const { height } = useSettingStore((state) => state.dimensions);

  const applyChanges = async () => {
    let _content = keep;
    let note = await db.notes.note(_content.noteId);
    await db.notes.add({
      id: note.id,
      conflicted: false,
      dateEdited: _content.dateEdited
    });

    await db.content.add({
      id: note.contentId,
      data: _content.data,
      type: _content.type,
      dateResolved: content.current?.conflicted?.dateModified || Date.now(),
      sessionId: Date.now(),
      conflicted: false
    });

    if (copy) {
      await db.notes.add({
        title: note.title + " (Copy)",
        content: {
          data: copy.data,
          type: copy.type
        }
      });
    }
    Navigation.queueRoutesForUpdate();

    if (useTabStore.getState().getCurrentNoteId() === note.id) {
      // reload the note in editor
      eSendEvent(eOnLoadNote, {
        item: editorController.current.note.current[note.id],
        forced: true
      });
    }
    close();
    Sync.run();
  };

  const show = async (item) => {
    let noteContent = await db.content.get(item.contentId);
    content.current = { ...noteContent };
    if (__DEV__) {
      if (!noteContent.conflicted) {
        content.current.conflicted = { ...noteContent };
      }
    }
    setVisible(true);
  };

  useEffect(() => {
    eSubscribeEvent(eShowMergeDialog, show);
    return () => {
      eUnSubscribeEvent(eShowMergeDialog, show);
    };
  }, []);

  const close = () => {
    setVisible(false);
    setCopy(null);
    setKeep(null);
    setDialogVisible(false);
  };

  const ConfigBar = ({
    isDiscarded,
    keeping,
    back,
    isCurrent,
    contentToKeep
  }) => {
    return (
      <View
        style={{
          width: "100%",
          height: 50,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingLeft: 6
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 1
          }}
        >
          {back && (
            <IconButton
              onPress={close}
              color={colors.primary.paragraph}
              name="arrow-left"
            />
          )}
          <Paragraph
            style={{ flexWrap: "wrap" }}
            color={colors.secondary.paragraph}
            size={AppFontSize.xs}
          >
            <Text
              style={{
                color: isCurrent ? colors.primary.accent : colors.static.red,
                fontWeight: "bold"
              }}
            >
              (
              {isCurrent
                ? strings.mergeConflict.thisDevice()
                : strings.mergeConflict.otherDevice()}
              )
            </Text>
            {"\n"}
            {getFormattedDate(contentToKeep?.dateEdited)}
          </Paragraph>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end"
          }}
        >
          {isDiscarded ? (
            <Button
              onPress={() => {
                setCopy(contentToKeep);
                setDialogVisible(true);
              }}
              title={strings.saveACopy()}
              type="secondary"
              height={30}
              style={{
                borderRadius: 100,
                paddingHorizontal: 12
              }}
              fontSize={AppFontSize.xs}
            />
          ) : null}
          <View style={{ width: 10 }} />
          {isDiscarded ? (
            <Button
              title={strings.discard()}
              type="accent"
              buttonType={{
                color: colors.static.red,
                text: colors.static.white
              }}
              height={30}
              style={{
                borderRadius: 100,
                paddingHorizontal: 12
              }}
              fontSize={AppFontSize.xs}
              color={colors.error.paragraph}
              onPress={() => {
                setDialogVisible(true);
              }}
            />
          ) : null}
          {isDiscarded ? null : (
            <>
              <Button
                height={30}
                style={{
                  borderRadius: 100,
                  paddingHorizontal: 12,
                  minWidth: 60,
                  marginLeft: 10
                }}
                type="accent"
                fontSize={AppFontSize.xs}
                title={
                  keeping && !isDiscarded ? strings.undo() : strings.keep()
                }
                onPress={() => {
                  setKeep(keeping && !isDiscarded ? null : contentToKeep);
                }}
              />
            </>
          )}
        </View>
      </View>
    );
  };

  return !visible ? null : (
    <BaseDialog
      statusBarTranslucent
      transparent={false}
      animationType="slide"
      animated={false}
      bounce={false}
      onRequestClose={() => {
        close();
      }}
      centered={false}
      background={colors?.primary.background}
      supportedOrientations={[
        "portrait",
        "portrait-upside-down",
        "landscape",
        "landscape-left",
        "landscape-right"
      ]}
      visible={true}
    >
      <SafeAreaView
        style={{
          backgroundColor: colors.primary.background,
          paddingTop: insets.top
        }}
      >
        <KeepAwake />
        {dialogVisible && (
          <BaseDialog visible={true}>
            <DialogContainer>
              <DialogHeader title={strings.applyChanges()} padding={12} />
              <Seperator />
              <DialogButtons
                positiveTitle="Apply"
                negativeTitle="Cancel"
                onPressNegative={() => setDialogVisible(false)}
                onPressPositive={applyChanges}
              />
            </DialogContainer>
          </BaseDialog>
        )}

        <View
          style={{
            height: "100%",
            width: "100%",
            backgroundColor: DDS.isLargeTablet() ? "rgba(0,0,0,0.3)" : null
          }}
        >
          <ConfigBar
            back={true}
            isCurrent={true}
            isDiscarded={isKeeping && isKeepingConflicted}
            keeping={isKeeping}
            contentToKeep={content.current}
          />

          <Animated.View
            style={{
              height: height / 2 - (50 + insets.top / 2),
              backgroundColor: colors.primary.background,
              borderBottomWidth: 1,
              borderBottomColor: colors.primary.border
            }}
          >
            <ReadonlyEditor
              editorId="conflictPrimary"
              onLoad={async (loadContent) => {
                const note = await db.notes.note(content.current?.noteId);
                if (!note) return;
                loadContent({
                  id: note.id,
                  data: diff(
                    content.current.conflicted.data,
                    content.current.data
                  )
                });
              }}
            />
          </Animated.View>

          <ConfigBar
            back={false}
            isCurrent={false}
            isDiscarded={isKeeping && !isKeepingConflicted}
            keeping={isKeeping}
            contentToKeep={content.current.conflicted}
          />

          <Animated.View
            style={{
              height: height / 2 - (50 + insets.top / 2),
              backgroundColor: colors.primary.background,
              borderRadius: 10
            }}
          >
            <ReadonlyEditor
              editorId="conflictSecondary"
              onLoad={async (loadContent) => {
                const note = await db.notes.note(content.current?.noteId);
                if (!note) return;
                loadContent({
                  id: note.id,
                  data: content.current.conflicted.data
                });
              }}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </BaseDialog>
  );
};

export default MergeConflicts;
