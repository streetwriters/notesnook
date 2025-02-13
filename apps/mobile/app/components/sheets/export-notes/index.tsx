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
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  View
} from "react-native";
import FileViewer from "react-native-file-viewer";
import Share from "react-native-share";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../../e2e/test.ids";
import { db } from "../../../common/database";
import { requestInAppReview } from "../../../services/app-review";
import {
  PresentSheetOptions,
  ToastManager,
  presentSheet
} from "../../../services/event-manager";
import Exporter from "../../../services/exporter";
import PremiumService from "../../../services/premium";
import { useUserStore } from "../../../stores/use-user-store";
import { getElevationStyle } from "../../../utils/elevation";
import { AppFontSize, defaultBorderRadius, ph, pv } from "../../../utils/size";
import { sleep } from "../../../utils/time";
import { Dialog } from "../../dialog";
import DialogHeader from "../../dialog/dialog-header";
import { ProTag } from "../../premium/pro-tag";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { Pressable } from "../../ui/pressable";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";

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
        fileDir: string;
      }
    | undefined
  >();
  const [status, setStatus] = useState<string>();
  const premium = useUserStore((state) => state.premium);

  const exportNoteAs = async (
    type: "pdf" | "txt" | "md" | "html" | "md-frontmatter"
  ) => {
    if (exporting) return;
    if (!PremiumService.get() && type !== "txt") return;
    setExporting(true);
    update?.({ disableClosing: true } as PresentSheetOptions);
    setComplete(false);
    let result;
    if (ids.length > 1) {
      result = await Exporter.bulkExport(
        db.notes.all.where((eb) => eb("id", "in", ids)),
        type,
        setStatus
      );
    } else {
      const note = await db.notes.note(ids[0]);
      if (!note) {
        setExporting(false);
        return;
      }
      result = await Exporter.exportNote(note, type, setStatus);
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
        await exportNoteAs("pdf");
      },
      icon: "file-pdf-box",
      id: notesnook.ids.dialogs.export.pdf,
      pro: premium
    },
    {
      title: "Markdown",
      func: async () => {
        await exportNoteAs("md");
      },
      icon: "language-markdown",
      id: notesnook.ids.dialogs.export.md,
      pro: premium
    },
    {
      title: "Markdown + Frontmatter",
      func: async () => {
        await exportNoteAs("md-frontmatter");
      },
      icon: "language-markdown",
      id: notesnook.ids.dialogs.export.md,
      pro: premium
    },
    {
      title: "Plain Text",
      func: async () => {
        await exportNoteAs("txt");
      },
      icon: "card-text",
      id: notesnook.ids.dialogs.export.text,
      pro: true
    },
    {
      title: "HTML",
      func: async () => {
        await exportNoteAs("html");
      },
      icon: "language-html5",
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
              title={strings.exportNotes(ids.length)}
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
              <Pressable
                onPress={item.func}
                style={{
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
                    borderRadius: defaultBorderRadius,
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
                    size={AppFontSize.xxxl + 10}
                  />
                </View>
                <View
                  style={{
                    flexShrink: 1
                  }}
                >
                  {!item.pro ? <ProTag size={12} /> : null}
                  <Heading style={{ marginLeft: 10 }} size={AppFontSize.md}>
                    {item.title}
                  </Heading>
                  {/* <Paragraph
                    style={{ marginLeft: 10 }}
                    size={SIZE.sm}
                    color={colors.secondary.paragraph}
                  >
                    {item.desc}
                  </Paragraph> */}
                </View>
              </Pressable>
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
                  {strings.exportingNotes(status) +
                    "..." +
                    " " +
                    strings.pleaseWait()}
                </Paragraph>
              </>
            ) : (
              <>
                <IconButton
                  name="export"
                  color={colors.primary.icon}
                  size={50}
                  style={{
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
                  {strings.exportSuccessHeading(ids.length)}
                </Heading>
                <Paragraph
                  style={{
                    textAlign: "center"
                  }}
                >
                  {strings.exportSuccessDesc(result?.fileName as string)}
                </Paragraph>
                <Button
                  title={
                    Platform.OS === "android"
                      ? strings.openFileLocation()
                      : strings.open()
                  }
                  type="accent"
                  width={250}
                  fontSize={AppFontSize.md}
                  style={{
                    marginTop: 10,
                    borderRadius: 100
                  }}
                  onPress={async () => {
                    if (!result?.filePath) return;
                    if (Platform.OS === "android") {
                      Linking.openURL(result.fileDir).catch((e) => {
                        ToastManager.error(e as Error);
                      });
                    } else {
                      FileViewer.open(result?.filePath, {
                        showOpenWithDialog: true,
                        showAppsSuggestions: true
                      }).catch((e) => {
                        ToastManager.show({
                          heading: strings.noApplicationFound(result.name),
                          type: "success",
                          context: "local"
                        });
                      });
                    }
                  }}
                />
                <Button
                  title={strings.share()}
                  type="secondaryAccented"
                  width={250}
                  fontSize={AppFontSize.md}
                  style={{
                    marginTop: 10,
                    borderRadius: 100
                  }}
                  onPress={async () => {
                    if (!result) return;
                    if (Platform.OS === "ios") {
                      Share.open({
                        url: result?.fileDir + result.fileName
                      }).catch(() => {
                        /* empty */
                      });
                    } else {
                      FileViewer.open(result.filePath, {
                        showOpenWithDialog: true,
                        showAppsSuggestions: true,
                        shareFile: true
                      } as any).catch(() => {
                        /* empty */
                      });
                    }
                  }}
                />
                <Button
                  title={strings.exportAgain()}
                  type="inverted"
                  width={250}
                  fontSize={AppFontSize.md}
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
    borderRadius: defaultBorderRadius,
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
    borderRadius: defaultBorderRadius,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    flexDirection: "row"
  },
  buttonText: {
    //fontFamily: "sans-serif",
    color: "white",
    fontSize: AppFontSize.sm,
    marginLeft: 5
  },
  overlay: {
    width: "100%",
    height: "100%",
    position: "absolute"
  }
});

export default ExportNotesSheet;
