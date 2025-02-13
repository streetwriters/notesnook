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

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, TextInput, View } from "react-native";
import {
  addOrientationListener,
  removeOrientationListener
} from "react-native-orientation";
import Pdf from "react-native-pdf";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import downloadAttachment from "../../../common/filesystem/download-attachment";
import { cacheDir } from "../../../common/filesystem/utils";
import { useAttachmentProgress } from "../../../hooks/use-attachment-progress";
import useGlobalSafeAreaInsets from "../../../hooks/use-global-safe-area-insets";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { AppFontSize } from "../../../utils/size";
import { Dialog } from "../../dialog";
import BaseDialog from "../../dialog/base-dialog";
import { presentDialog } from "../../dialog/functions";
import SheetProvider from "../../sheet-provider";
import { IconButton } from "../../ui/icon-button";
import { ProgressBarComponent } from "../../ui/svg/lazy";
import Paragraph from "../../ui/typography/paragraph";
import { sleep } from "../../../utils/time";
import { MMKV } from "../../../common/database/mmkv";
import { deleteCacheFileByPath } from "../../../common/filesystem/io";
import { strings } from "@notesnook/intl";

const WIN_WIDTH = Dimensions.get("window").width;
const WIN_HEIGHT = Dimensions.get("window").height;

const attachmentSnapshotsKey = "___attachmentsnapshots";
const usePDFSnapshot = (attachment) => {
  const snapshots = useRef(MMKV.getMap(attachmentSnapshotsKey) || {});
  const snapshot = useRef(snapshots[attachment?.id]);

  function saveSnapshot(ss) {
    if (!attachment) return;
    snapshots.current[attachment.id] = ss;
    MMKV.setMap(attachmentSnapshotsKey, snapshots.current);
    snapshot.current = snapshots.current[attachment.id];
  }

  return [snapshot, saveSnapshot];
};

const PDFPreview = () => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [pdfSource, setPDFSource] = useState();
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(WIN_WIDTH);
  const insets = useGlobalSafeAreaInsets();
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const inputRef = useRef();
  const pdfRef = useRef();
  const [attachment, setAttachment] = useState(null);
  const [password, setPassword] = useState("");
  const [progress] = useAttachmentProgress(attachment);
  const [snapshot, saveSnapshot] = usePDFSnapshot(attachment);
  const snapshotValue = useRef(snapshot.current);

  useEffect(() => {
    eSubscribeEvent("PDFPreview", open);
    return () => {
      eUnSubscribeEvent("PDFPreview", open);
    };
  }, [open]);

  const onOrientationChange = (o) => {
    if (o.includes("LANDSCAPE")) {
      setWidth(WIN_HEIGHT);
    } else {
      setWidth(WIN_WIDTH);
    }
  };

  useEffect(() => {
    addOrientationListener(onOrientationChange);
    return () => {
      removeOrientationListener(onOrientationChange);
    };
  }, []);

  const open = useCallback(
    async (attachment) => {
      setVisible(true);
      setLoading(true);
      setTimeout(async () => {
        setAttachment(attachment);
        let hash = attachment.hash;
        if (!hash) return;
        const uri = await downloadAttachment(hash, false, {
          silent: true,
          cache: true
        });
        const path = `${cacheDir}/${uri}`;
        snapshotValue.current = snapshot.current;
        setPDFSource("file://" + path);
        setLoading(false);
      }, 100);
    },
    [snapshot]
  );

  const close = () => {
    deleteCacheFileByPath(pdfSource);
    setPDFSource(null);
    setVisible(false);
    setPassword("");
  };

  const onError = async (error) => {
    if (error?.message === "Password required or incorrect password.") {
      await sleep(300);
      presentDialog({
        context: attachment?.hash,
        input: true,
        inputPlaceholder: strings.enterPassword(),
        positiveText: strings.open(),
        title: strings.pdfLocked(),
        paragraph: strings.pdfLockedDesc(),
        positivePress: (value) => {
          setTimeout(() => {
            setPassword(value);
          });
        },
        onClose: () => {
          close();
        }
      });
    }
  };

  return (
    visible && (
      <BaseDialog animation="fade" visible={true} onRequestClose={close}>
        <SheetProvider context={attachment?.hash} />
        <Dialog context={attachment?.hash} />

        <View
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "black"
          }}
        >
          {loading ? (
            <Animated.View
              exiting={FadeOut}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <ProgressBarComponent
                indeterminate={!progress}
                color={colors.primary.accent}
                borderColor="transparent"
                progress={parseInt(progress?.value || "100") / 100}
              />
              <Paragraph
                style={{
                  marginTop: 10
                }}
                color={colors.static.white}
              >
                {strings.loadingWithProgress(progress?.percent)}
              </Paragraph>
            </Animated.View>
          ) : (
            <>
              <View
                style={{
                  width: "100%",
                  height: 50,
                  marginTop: insets.top,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 12,
                  paddingLeft: 6
                }}
              >
                <View
                  style={{
                    flexDirection: "row"
                  }}
                >
                  <IconButton
                    color={colors.static.white}
                    name="arrow-left"
                    onPress={close}
                    style={{
                      marginRight: 12
                    }}
                    size={AppFontSize.xxl}
                  />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginRight: 12
                  }}
                >
                  <TextInput
                    ref={inputRef}
                    defaultValue={currentPage + ""}
                    style={{
                      color: colors.primary.paragraph,
                      padding: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      marginTop: 0,
                      marginBottom: 0,
                      paddingVertical: 0,
                      height: 25,
                      backgroundColor: colors.secondary.background,
                      width: 40,
                      textAlign: "center",
                      marginRight: 4,
                      borderRadius: 3,
                      fontFamily: "OpenSans-Regular"
                    }}
                    selectTextOnFocus
                    keyboardType="decimal-pad"
                    onSubmitEditing={(event) => {
                      setCurrentPage(event.nativeEvent.text);
                      pdfRef.current?.setPage(parseInt(event.nativeEvent.text));
                    }}
                    blurOnSubmit
                  />
                  <Paragraph color={colors.static.white}>/{numPages}</Paragraph>
                </View>

                <View
                  style={{
                    flexDirection: "row"
                  }}
                >
                  <IconButton
                    color={colors.static.white}
                    name="download"
                    onPress={() => {
                      downloadAttachment(attachment.hash, false);
                    }}
                  />
                </View>
              </View>
              {pdfSource ? (
                <Animated.View
                  style={{
                    flex: 1
                  }}
                  entering={FadeIn}
                >
                  <Pdf
                    source={{
                      uri: pdfSource
                    }}
                    ref={pdfRef}
                    onLoadComplete={(numberOfPages) => {
                      setNumPages(numberOfPages);
                    }}
                    onPageChanged={(page) => {
                      setCurrentPage(page);
                      inputRef.current?.setNativeProps({
                        text: page + ""
                      });
                      saveSnapshot({
                        currentPage: page,
                        scale: snapshot?.current?.scale
                      });
                    }}
                    // scale={snapshotValue.current?.scale}
                    // onScaleChanged={(scale) => {
                    //   saveSnapshot({
                    //     currentPage: snapshot?.current?.currentPage,
                    //     scale: scale
                    //   });
                    // }}
                    page={snapshotValue?.current?.currentPage}
                    password={password}
                    maxScale={6}
                    onError={onError}
                    onPressLink={(uri) => {}}
                    style={{
                      flex: 1,
                      width: width,
                      height: Dimensions.get("window").height
                    }}
                  />
                </Animated.View>
              ) : null}
            </>
          )}
        </View>
      </BaseDialog>
    )
  );
};

export default PDFPreview;
