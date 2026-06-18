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
import React, { useState } from "react";
import { ActivityIndicator, Linking, Platform, View } from "react-native";
import FileViewer from "react-native-file-viewer";
import Share from "react-native-share";
import { notesnook } from "../../../../e2e/test.ids";
import { Radius, Spacing } from "../../../common/design/spacing";
import { db } from "../../../common/database";
import { requestInAppReview } from "../../../services/app-review";
import {
  PresentSheetOptions,
  ToastManager,
  presentSheet
} from "../../../services/event-manager";
import Exporter from "../../../services/exporter";
import { useSettingStore } from "../../../stores/use-setting-store";
import { sleep } from "../../../utils/time";
import { Dialog } from "../../dialog";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import { Pressable } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

const ExportNotesSheet = ({
  ids,
  update,
  close
}: {
  ids: string[];
  update: ((props: PresentSheetOptions) => void) | undefined;
  close: ((ctx?: string) => void) | undefined;
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

  const exportNoteAs = async (
    type: "pdf" | "txt" | "md" | "html" | "md-frontmatter"
  ) => {
    if (exporting) return;
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
      icon: "file-pdf",
      id: notesnook.ids.dialogs.export.pdf
    },
    {
      title: "Markdown",
      func: async () => {
        await exportNoteAs("md");
      },
      icon: "markdown",
      id: notesnook.ids.dialogs.export.md
    },
    {
      title: "Markdown + Frontmatter",
      func: async () => {
        await exportNoteAs("md-frontmatter");
      },
      icon: "markdown",
      id: notesnook.ids.dialogs.export.md
    },
    {
      title: "Plain Text",
      func: async () => {
        await exportNoteAs("txt");
      },
      icon: "file-text",
      id: notesnook.ids.dialogs.export.text
    },
    {
      title: "HTML",
      func: async () => {
        await exportNoteAs("html");
      },
      icon: "file-html",
      id: notesnook.ids.dialogs.export.html
    }
  ];

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.primary.background,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_2,
        gap: Spacing.LEVEL_3
      }}
    >
      <Dialog context="export-notes" />

      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: Spacing.LEVEL_1
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: Radius.XS,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.secondary.background
          }}
        >
          <AppIcon
            name="export"
            iconFamily="notesnook"
            size={16}
            color={colors.primary.icon}
          />
        </View>

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            gap: Spacing.LEVEL_1
          }}
        >
          <Heading fontSize="XL" lineHeight="100%">
            {complete
              ? strings.exportSuccessHeading(ids.length)
              : strings.exportNotes(ids.length)}
          </Heading>
          <Paragraph>
            {complete
              ? strings.exportSuccessDesc(result?.fileName as string)
              : strings.exportAllNotesDesc()}
          </Paragraph>
        </View>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: colors.primary.border
        }}
      />

      {!complete && !exporting ? (
        <>
          <View
            style={{
              gap: Spacing.LEVEL_0
            }}
          >
            {actions.map((item) => (
              <Pressable
                key={item.title}
                testID={item.id}
                type="transparent"
                onPress={item.func}
                style={{
                  width: "100%",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: Spacing.LEVEL_2,
                  paddingVertical: Spacing.LEVEL_1,
                  borderRadius: Radius.S
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: Radius.XS,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.secondary.background
                  }}
                >
                  <AppIcon
                    name={item.icon}
                    iconFamily="notesnook"
                    size={16}
                    color={colors.primary.icon}
                  />
                </View>
                <Heading fontSize="MD" lineHeight="100%">
                  {item.title}
                </Heading>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <View
          style={{
            minHeight: 150,
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            paddingVertical: Spacing.LEVEL_3,
            gap: Spacing.LEVEL_2
          }}
        >
          {!complete ? (
            <>
              <ActivityIndicator color={colors.primary.accent} />
              <Paragraph>
                {strings.exportingNotes(status) +
                  "..." +
                  " " +
                  strings.pleaseWait()}
              </Paragraph>
            </>
          ) : (
            <>
              <Button
                title={
                  Platform.OS === "android"
                    ? strings.openFileLocation()
                    : strings.open()
                }
                type="accent"
                width={"100%"}
                onPress={async () => {
                  if (!result?.filePath) return;
                  close?.();
                  useSettingStore
                    .getState()
                    .setAppDidEnterBackgroundForAction(true);
                  if (Platform.OS === "android") {
                    Linking.openURL(result.fileDir).catch((e) => {
                      ToastManager.error(e as Error);
                    });
                  } else {
                    await sleep(500);
                    FileViewer.open(result?.filePath, {
                      showOpenWithDialog: true,
                      showAppsSuggestions: true
                    }).catch(() => {
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
                type="secondary-simple"
                width={"100%"}
                onPress={async () => {
                  if (!result) return;
                  close?.();
                  useSettingStore
                    .getState()
                    .setAppDidEnterBackgroundForAction(true);
                  if (Platform.OS === "ios") {
                    await sleep(500);
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
                type="plain-outline"
                width={"100%"}
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
  );
};

ExportNotesSheet.present = async (ids?: string[], allNotes?: boolean) => {
  const exportNoteIds = allNotes ? await db.notes.all?.ids() : ids || [];
  presentSheet({
    component: (ref, close, update) => (
      <ExportNotesSheet ids={exportNoteIds} update={update} close={close} />
    ),
    keyboardHandlerDisabled: true
  });
};

export default ExportNotesSheet;
