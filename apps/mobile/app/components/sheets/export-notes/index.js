/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
import { Platform, StyleSheet, View } from "react-native";
import FileViewer from "react-native-file-viewer";
import Share from "react-native-share";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../../e2e/test.ids";
import { presentSheet, ToastEvent } from "../../../services/event-manager";
import Exporter from "../../../services/exporter";
import { useThemeStore } from "../../../stores/use-theme-store";
import { getElevation } from "../../../utils";
import { ph, pv, SIZE } from "../../../utils/size";
import { sleep } from "../../../utils/time";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import { PressableButton } from "../../ui/pressable";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

const ExportNotesSheet = ({ notes }) => {
  const colors = useThemeStore((state) => state.colors);
  const [exporting, setExporting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [result, setResult] = useState({});

  const save = async (func) => {
    if (exporting) return;
    setExporting(true);
    setComplete(false);
    let res;
    for (var i = 0; i < notes.length; i++) {
      let note = notes[i];
      res = await func(note);
      if (!res) {
        setExporting(false);
        return;
      }
    }

    setResult(res);
    setComplete(true);
    setExporting(false);
  };

  const actions = [
    {
      title: "PDF",
      func: async () => {
        await save(Exporter.saveToPDF, "PDF");
      },
      icon: "file-pdf-box",
      desc: "Can be opened in a pdf reader like Adobe or Foxit Reader",
      id: notesnook.ids.dialogs.export.pdf
    },
    {
      title: "Markdown",
      func: async () => {
        await save(Exporter.saveToMarkdown, "Markdown");
      },
      icon: "language-markdown",
      desc: "Can be opened in any text or markdown editor",
      id: notesnook.ids.dialogs.export.md
    },
    {
      title: "Plain Text",
      func: async () => {
        await save(Exporter.saveToText, "Text");
      },
      icon: "card-text",
      desc: "Can be opened in any text editor",
      id: notesnook.ids.dialogs.export.text
    },
    {
      title: "HTML",
      func: async () => {
        await save(Exporter.saveToHTML, "Html");
      },
      icon: "language-html5",
      desc: "Can be opened in any web browser",
      id: notesnook.ids.dialogs.export.html
    }
  ];

  return (
    <View>
      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        <DialogHeader
          icon="export"
          title="Export Note"
          paragraph={
            "All exports are saved in Notesnook/exported folder in phone storage"
          }
        />
      </View>

      <Seperator half />
      <View style={styles.buttonContainer}>
        {actions.map((item) => (
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
                paddingHorizontal: 12
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
                  color={colors.accent}
                  size={SIZE.xxxl + 10}
                />
              </View>
              <View
                style={{
                  flexShrink: 1
                }}
              >
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
        ))}

        <View
          style={{
            width: "100%",
            paddingHorizontal: 12,
            marginTop: 10
          }}
        >
          {complete && (
            <>
              <Button
                title="Open"
                type="accent"
                width="100%"
                fontSize={SIZE.md}
                onPress={async () => {
                  close();
                  await sleep(500);
                  FileViewer.open(result.filePath, {
                    showOpenWithDialog: true,
                    showAppsSuggestions: true
                  }).catch(() => {
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
                type="shade"
                width="100%"
                fontSize={SIZE.md}
                style={{
                  marginTop: 10
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
            </>
          )}
          {complete && (
            <Paragraph
              style={{
                textAlign: "center",
                marginTop: 5
              }}
              color={colors.icon}
              size={SIZE.xs}
            >
              {"Note exported as " + result.fileName}
            </Paragraph>
          )}
        </View>
      </View>
    </View>
  );
};

ExportNotesSheet.present = (note) => {
  presentSheet({
    component: <ExportNotesSheet notes={[note]} />
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
