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

import React, { useEffect, useRef, useState } from "react";
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
import { useThemeStore } from "../../../stores/use-theme-store";
import { SIZE } from "../../../utils/size";
import { Dialog } from "../../dialog";
import BaseDialog from "../../dialog/base-dialog";
import { presentDialog } from "../../dialog/functions";
import SheetProvider from "../../sheet-provider";
import { IconButton } from "../../ui/icon-button";
import { ProgressBarComponent } from "../../ui/svg/lazy";
import Paragraph from "../../ui/typography/paragraph";
import { sleep } from "../../../utils/time";

const WIN_WIDTH = Dimensions.get("window").width;
const WIN_HEIGHT = Dimensions.get("window").height;

const PDFPreview = () => {
  const colors = useThemeStore((state) => state.colors);
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

  useEffect(() => {
    eSubscribeEvent("PDFPreview", open);
    return () => {
      eUnSubscribeEvent("PDFPreview", open);
    };
  }, []);

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

  const open = async (attachment) => {
    setVisible(true);
    setLoading(true);
    setTimeout(async () => {
      setAttachment(attachment);
      let hash = attachment.metadata.hash;
      if (!hash) return;
      const uri = await downloadAttachment(hash, false, {
        silent: true,
        cache: true
      });
      const path = `${cacheDir}/${uri}`;
      setPDFSource("file://" + path);
      setLoading(false);
    }, 100);
  };

  const close = () => {
    setPDFSource(null);
    setVisible(false);
    setPassword("");
  };

  const onError = async (error) => {
    if (error?.message === "Password required or incorrect password.") {
      await sleep(300);
      presentDialog({
        context: attachment?.metadata?.hash,
        input: true,
        inputPlaceholder: "Enter password",
        positiveText: "Unlock",
        title: "Decrypt",
        paragraph: "Please input password to view pdf.",
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
        <SheetProvider context={attachment?.metadata?.hash} />
        <Dialog context={attachment?.metadata?.hash} />

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
                color={colors.accent}
                borderColor="transparent"
                progress={parseInt(progress?.value || "100") / 100}
              />
              <Paragraph
                style={{
                  marginTop: 10
                }}
                color={colors.light}
              >
                Loading {`${progress?.percent ? `(${progress?.percent})` : ""}`}
                ... Please wait
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
                    color={colors.light}
                    name="arrow-left"
                    onPress={close}
                    customStyle={{
                      marginRight: 12
                    }}
                    size={SIZE.xxl}
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
                      color: colors.pri,
                      padding: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                      marginTop: 0,
                      marginBottom: 0,
                      paddingVertical: 0,
                      height: 25,
                      backgroundColor: colors.nav,
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
                  <Paragraph color={colors.light}>/{numPages}</Paragraph>
                </View>

                <View
                  style={{
                    flexDirection: "row"
                  }}
                >
                  <IconButton
                    color={colors.light}
                    name="download"
                    onPress={() => {
                      downloadAttachment(attachment.metadata.hash, false);
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
                    }}
                    password={password}
                    maxScale={6}
                    onError={onError}
                    onPressLink={(uri) => {
                      console.log(`Link pressed: ${uri}`);
                    }}
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
