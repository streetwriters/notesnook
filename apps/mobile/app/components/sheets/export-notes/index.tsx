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
import React, { Fragment, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import FileViewer from "react-native-file-viewer";
import Share from "react-native-share";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../../e2e/test.ids";
import { db } from "../../../common/database";
import { requestInAppReview } from "../../../services/app-review";
import {
  PresentSheetOptions,
  ToastManager,
  eSendEvent,
  presentSheet
} from "../../../services/event-manager";
import Exporter from "../../../services/exporter";
import PremiumService from "../../../services/premium";
import { useUserStore } from "../../../stores/use-user-store";
import { getElevationStyle } from "../../../utils/elevation";
import { eCloseSheet } from "../../../utils/events";
import { SIZE, ph, pv } from "../../../utils/size";
import { sleep } from "../../../utils/time";
import DialogHeader from "../../dialog/dialog-header";
import { ProTag } from "../../premium/pro-tag";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { PressableButton } from "../../ui/pressable";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { Dialog } from "../../dialog";

const ExportNotesSheet = ({
  ids,
  update
}: {
  ids: string[];
  update: ((props: PresentSheetOptions) => void) | undefined;
}) => {
  const { colors } = useThemeColors();
  const [exporting, setExporting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState<
    | {
        fileName: string;
        filePath: string;
        name: string;
        type: string;
      }
    | undefined
  >();
  const [status, setStatus] = useState<string>();
  const premium = useUserStore((state) => state.premium);

  const save = async (
    type: "pdf" | "txt" | "md" | "html" | "md-frontmatter"
  ) => {
    if (exporting) return;
    if (!PremiumService.get() && type !== "txt") return;
    setExporting(true);
    update?.({ disableClosing: true } as PresentSheetOptions);
    setComplete(false);
    let result;
    if (ids.length > 1) {
      result = await Exporter.bulkExport(ids, type, setStatus);
    } else {
      result = await Exporter.exportNote(ids[0], type);
      await sleep(1000);
    }
    if (!result) {
      update?.({ disableClosing: false } as PresentSheetOptions);
      return setExporting(false);
    }
    setResult(result as any);
    update?.({ disableClosing: false } as PresentSheetOptions);
    setComplete(true);
    setExporting(false);
    requestInAppReview();
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
      title: "Markdown + Frontmatter",
      func: async () => {
        await save("md-frontmatter");
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
                ids.length > 1 ? `Export ${ids.length} Notes` : "Export Note"
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

      <Dialog context="export-notes" />

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
                    backgroundColor: colors.primary.shade,
                    borderRadius: 5,
                    height: 60,
                    width: 60,
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  <Icon
                    name={item.icon}
                    color={
                      item.pro ? colors.primary.accent : colors.primary.icon
                    }
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
                    color={colors.secondary.paragraph}
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
                  {ids.length === 1
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
                  color={colors.primary.icon}
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
                  color={colors.secondary.heading}
                >
                  {ids.length > 1
                    ? `${ids.length} Notes exported`
                    : "Note exported"}
                </Heading>
                <Paragraph
                  style={{
                    textAlign: "center"
                  }}
                >
                  Your {ids.length > 1 ? "notes are" : "note is"} exported
                  successfully as {result?.fileName}
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
                    if (!result?.filePath) return;
                    eSendEvent(eCloseSheet);
                    await sleep(500);
                    FileViewer.open(result?.filePath, {
                      showOpenWithDialog: true,
                      showAppsSuggestions: true
                    }).catch((e) => {
                      console.log(e);
                      ToastManager.show({
                        heading: "Cannot open",
                        message: `No application found to open ${result.name} file.`,
                        type: "success",
                        context: "local"
                      });
                    });
                  }}
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
                    if (!result?.filePath) return;
                    if (Platform.OS === "ios") {
                      Share.open({
                        url: result.filePath
                      }).catch(console.log);
                    } else {
                      FileViewer.open(result.filePath, {
                        showOpenWithDialog: true,
                        showAppsSuggestions: true,
                        shareFile: true
                      } as any).catch(console.log);
                    }
                  }}
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
                    setResult(undefined);
                    setExporting(false);
                  }}
                />
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

ExportNotesSheet.present = async (ids?: string[], allNotes?: boolean) => {
  const exportNoteIds = allNotes ? await db.notes.all?.ids() : ids || [];
  presentSheet({
    component: (ref, close, update) => (
      <ExportNotesSheet ids={exportNoteIds} update={update} />
    ),
    keyboardHandlerDisabled: true
  });
};

const styles = StyleSheet.create({
  container: {
    ...getElevationStyle(5),
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
