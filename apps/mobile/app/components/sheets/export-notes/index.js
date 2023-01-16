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

import React, { Fragment, useState } from "react";
import { Platform, StyleSheet, View, ActivityIndicator } from "react-native";
import FileViewer from "react-native-file-viewer";
import Share from "react-native-share";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../../e2e/test.ids";
import { db } from "../../../common/database";
import { presentSheet, ToastEvent } from "../../../services/event-manager";
import Exporter from "../../../services/exporter";
import PremiumService from "../../../services/premium";
import { useThemeStore } from "../../../stores/use-theme-store";
import { useUserStore } from "../../../stores/use-user-store";
import { getElevation } from "../../../utils";
import { ph, pv, SIZE } from "../../../utils/size";
import { sleep } from "../../../utils/time";
import DialogHeader from "../../dialog/dialog-header";
import { ProTag } from "../../premium/pro-tag";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { PressableButton } from "../../ui/pressable";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { eSendEvent } from "../../../services/event-manager";
import { eCloseSheet } from "../../../utils/events";

const ExportNotesSheet = ({ notes, update }) => {
  const colors = useThemeStore((state) => state.colors);
  const [exporting, setExporting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState({});
  const [status, setStatus] = useState(null);
  const premium = useUserStore((state) => state.premium);

  const save = async (type) => {
    if (exporting) return;
    if (!PremiumService.get() && type !== "txt") return;
    setExporting(true);
    update({ disableClosing: true });
    setComplete(false);
    let result;
    if (notes.length > 1) {
      result = await Exporter.bulkExport(notes, type, setStatus);
    } else {
      result = await Exporter.exportNote(notes[0], type);
      await sleep(1000);
    }
    if (!result) {
      update({ disableClosing: false });
      return setExporting(false);
    }
    setResult(result);
    update({ disableClosing: false });
    setComplete(true);
    setExporting(false);
  };

  const actions = [
    {
      title: "PDF",
      func: async () => {
        await save("pdf");
      },
      icon: "file-pdf-box",
      desc: "View in any pdf reader app",
      id: notesnook.ids.dialogs.export.pdf,
      pro: premium
    },
    {
      title: "Markdown",
      func: async () => {
        await save("md");
      },
      icon: "language-markdown",
      desc: "View in any text or markdown editor",
      id: notesnook.ids.dialogs.export.md,
      pro: premium
    },
    {
      title: "Plain Text",
      func: async () => {
        await save("txt");
      },
      icon: "card-text",
      desc: "View in any text editor",
      id: notesnook.ids.dialogs.export.text,
      pro: true
    },
    {
      title: "HTML",
      func: async () => {
        await save("html");
      },
      icon: "language-html5",
      desc: "View in any web browser & html reader",
      id: notesnook.ids.dialogs.export.html,
      pro: premium
    }
  ];

  return (
    <View>
      {!complete && !exporting ? (
        <>
          <View
            style={{
              paddingHorizontal: 12
            }}
          >
            <DialogHeader
              icon="export"
              title={
                notes.length > 1
                  ? `Export ${notes.length} Notes`
                  : "Export Note"
              }
              paragraph={`All exports are saved in ${
                Platform.OS === "android"
                  ? "the selected"
                  : "Notesnook/exported"
              } folder in phone storage`}
            />
          </View>

          <Seperator half />
        </>
      ) : null}

      <View style={styles.buttonContainer}>
        {!exporting && !complete ? (
          actions.map((item) => (
            <Fragment key={item.title}>
              <Seperator half />
              <PressableButton
                onPress={item.func}
                customStyle={{
                  width: "100%",
                  alignItems: "center",
                  flexDirection: "row",
                  paddingRight: 12,
                  paddingVertical: 10,
                  justifyContent: "flex-start",
                  borderRadius: 0,
                  paddingHorizontal: 12,
                  opacity: item.pro ? 1 : 0.5
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.shade,
                    borderRadius: 5,
                    height: 60,
                    width: 60,
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Icon
                    name={item.icon}
                    color={item.pro ? colors.accent : colors.icon}
                    size={SIZE.xxxl + 10}
                  />
                </View>
                <View
                  style={{
                    flexShrink: 1
                  }}
                >
                  {!item.pro ? <ProTag size={12} /> : null}
                  <Heading style={{ marginLeft: 10 }} size={SIZE.md}>
                    {item.title}
                  </Heading>
                  <Paragraph
                    style={{ marginLeft: 10 }}
                    size={SIZE.sm}
                    color={colors.icon}
                  >
                    {item.desc}
                  </Paragraph>
                </View>
              </PressableButton>
            </Fragment>
          ))
        ) : (
          <View
            style={{
              minHeight: 150,
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              paddingHorizontal: 12,
              paddingVertical: 20
            }}
          >
            {!complete ? (
              <>
                <ActivityIndicator />
                <Paragraph>
                  {notes.length === 1
                    ? "Exporting note... Please wait"
                    : `Exporting notes${
                        status ? ` (${status})` : ``
                      }... Please wait`}
                </Paragraph>
              </>
            ) : (
              <>
                <IconButton
                  name="export"
                  color={colors.icon}
                  size={50}
                  customStyle={{
                    width: 70,
                    height: 70
                  }}
                />
                <Heading
                  style={{
                    textAlign: "center",
                    marginTop: 10
                  }}
                  color={colors.icon}
                >
                  {notes.length > 1
                    ? `${notes.length} Notes exported`
                    : "Note exported"}
                </Heading>
                <Paragraph
                  style={{
                    textAlign: "center"
                  }}
                >
                  Your {notes.length > 1 ? "notes are" : "note is"} exported
                  successfully as {result.fileName}
                </Paragraph>
                <Button
                  title="Open"
                  type="accent"
                  width={250}
                  fontSize={SIZE.md}
                  style={{
                    marginTop: 10,
                    borderRadius: 100
                  }}
                  onPress={async () => {
                    eSendEvent(eCloseSheet);
                    await sleep(500);
                    FileViewer.open(result.filePath, {
                      showOpenWithDialog: true,
                      showAppsSuggestions: true
                    }).catch((e) => {
                      console.log(e);
                      ToastEvent.show({
                        heading: "Cannot open",
                        message: `No application found to open ${result.name} file.`,
                        type: "success",
                        context: "local"
                      });
                    });
                  }}
                  height={50}
                />
                <Button
                  title="Share"
                  type="grayAccent"
                  width={250}
                  fontSize={SIZE.md}
                  style={{
                    marginTop: 10,
                    borderRadius: 100
                  }}
                  onPress={async () => {
                    if (Platform.OS === "ios") {
                      Share.open({
                        url: result.filePath
                      }).catch(console.log);
                    } else {
                      FileViewer.open(result.filePath, {
                        showOpenWithDialog: true,
                        showAppsSuggestions: true,
                        shareFile: true
                      }).catch(console.log);
                    }
                  }}
                  height={50}
                />
                <Button
                  title="Export in another format"
                  type="grayAccent"
                  width={250}
                  fontSize={SIZE.md}
                  style={{
                    marginTop: 10,
                    borderRadius: 100
                  }}
                  onPress={async () => {
                    setComplete(false);
                    setResult(null);
                    setExporting(false);
                  }}
                  height={50}
                />
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

ExportNotesSheet.present = (notes, allNotes) => {
  presentSheet({
    component: (ref, close, update) => (
      <ExportNotesSheet
        notes={allNotes ? db.notes.all : notes}
        update={update}
      />
    )
  });
};

const styles = StyleSheet.create({
  container: {
    ...getElevation(5),
    borderRadius: 5,
    paddingVertical: pv
  },
  buttonContainer: {
    justifyContent: "space-between",
    alignItems: "center"
  },
  button: {
    paddingVertical: pv,
    paddingHorizontal: ph,
    marginTop: 10,
    borderRadius: 5,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row"
  },
  buttonText: {
    //fontFamily: "sans-serif",
    color: "white",
    fontSize: SIZE.sm,
    marginLeft: 5
  },
  overlay: {
    width: "100%",
    height: "100%",
    position: "absolute"
  }
});

export default ExportNotesSheet;
