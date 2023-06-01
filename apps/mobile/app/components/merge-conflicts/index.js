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

import KeepAwake from "@sayem314/react-native-keep-awake";
import React, { useEffect, useRef, useState } from "react";
import { Modal, SafeAreaView, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { db } from "../../common/database";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import Editor from "../../screens/editor";
import { editorController } from "../../screens/editor/tiptap/utils";
import { DDS } from "../../services/device-detection";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import Navigation from "../../services/navigation";
import Sync from "../../services/sync";
import { useThemeStore } from "../../stores/use-theme-store";
import { dHeight } from "../../utils";
import { eOnLoadNote, eShowMergeDialog } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { getFormattedDate, sleep } from "../../utils/time";
import BaseDialog from "../dialog/base-dialog";
import DialogButtons from "../dialog/dialog-buttons";
import DialogContainer from "../dialog/dialog-container";
import DialogHeader from "../dialog/dialog-header";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Seperator from "../ui/seperator";
import Paragraph from "../ui/typography/paragraph";

const MergeConflicts = () => {
  const colors = useThemeStore((state) => state.colors);
  const [visible, setVisible] = useState(false);
  const [keep, setKeep] = useState(null);
  const [copy, setCopy] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const insets = useGlobalSafeAreaInsets();
  const content = useRef(null);
  const isKeepingConflicted = !keep?.conflicted;
  const isKeeping = !!keep;

  const applyChanges = async () => {
    let _content = keep;
    let note = db.notes.note(_content.noteId).data;
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
    if (editorController.current?.note?.id === note.id) {
      // reload the note in editor
      eSendEvent(eOnLoadNote, {
        ...editorController.current?.note,
        forced: true
      });
    }
    close();
    Sync.run();
  };

  const show = async (item) => {
    let noteContent = await db.content.raw(item.contentId);
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
            <IconButton onPress={close} color={colors.pri} name="arrow-left" />
          )}
          <Paragraph
            style={{ flexWrap: "wrap" }}
            color={colors.icon}
            size={SIZE.xs}
          >
            <Text
              style={{
                color: isCurrent ? colors.accent : colors.red,
                fontWeight: "bold"
              }}
            >
              {isCurrent ? "(This Device)" : "(Incoming)"}
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
              title="Save a copy"
              type="grayBg"
              height={30}
              style={{
                borderRadius: 100,
                paddingHorizontal: 12
              }}
              fontSize={SIZE.xs}
            />
          ) : null}
          <View style={{ width: 10 }} />
          {isDiscarded ? (
            <Button
              title="Discard"
              type="accent"
              accentColor="red"
              height={30}
              style={{
                borderRadius: 100,
                paddingHorizontal: 12
              }}
              fontSize={SIZE.xs}
              accentText="light"
              color={colors.errorText}
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
                fontSize={SIZE.xs}
                title={keeping && !isDiscarded ? "Undo" : "Keep"}
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
    <Modal
      statusBarTranslucent
      transparent={false}
      animationType="slide"
      onRequestClose={() => {
        close();
      }}
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
          backgroundColor: colors.bg,
          paddingTop: insets.top
        }}
      >
        <KeepAwake />
        {dialogVisible && (
          <BaseDialog visible={true}>
            <DialogContainer>
              <DialogHeader
                title="Apply Changes"
                paragraph="Apply selected changes to note?"
                padding={12}
              />
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
              height: dHeight / 2 - (50 + insets.top / 2),
              backgroundColor: colors.bg,
              borderBottomWidth: 1,
              borderBottomColor: colors.nav
            }}
          >
            <Editor
              noHeader
              noToolbar
              readonly
              editorId=":conflictPrimary"
              onLoad={async () => {
                const note = db.notes.note(content.current?.noteId)?.data;
                if (!note) return;
                await sleep(300);
                eSendEvent(eOnLoadNote + ":conflictPrimary", {
                  ...note,
                  content: {
                    ...content.current,
                    isPreview: true
                  }
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
              height: dHeight / 2 - (50 + insets.top / 2),
              backgroundColor: colors.bg,
              borderRadius: 10
            }}
          >
            <Editor
              noHeader
              noToolbar
              readonly
              editorId=":conflictSecondary"
              onLoad={async () => {
                const note = db.notes.note(content.current?.noteId)?.data;
                if (!note) return;
                await sleep(300);
                eSendEvent(eOnLoadNote + ":conflictSecondary", {
                  ...note,
                  content: { ...content.current.conflicted, isPreview: true }
                });
              }}
            />
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default MergeConflicts;
