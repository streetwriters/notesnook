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

import Sodium from "@ammarahmed/react-native-sodium";
import dataurl from "@notesnook/core/dist/utils/dataurl";
import type { ImageAttributes } from "@notesnook/editor/dist/extensions/image/index";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";
import { db } from "../../common/database";
import downloadAttachment from "../../common/filesystem/download-attachment";
import { cacheDir } from "../../common/filesystem/utils";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import BaseDialog from "../dialog/base-dialog";
import { IconButton } from "../ui/icon-button";
import { ProgressBarComponent } from "../ui/svg/lazy";
const ImagePreview = () => {
  const { colors } = useThemeColors("dialog");

  const [visible, setVisible] = useState(false);
  const [image, setImage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const imageRef = useRef<ImageAttributes>();

  useEffect(() => {
    eSubscribeEvent("ImagePreview", open);
    return () => {
      eUnSubscribeEvent("ImagePreview", open);
    };
  }, []);

  const open = async (image: ImageAttributes) => {
    imageRef.current = image;
    setVisible(true);
    setLoading(true);
    setTimeout(async () => {
      let hash = image.hash;
      if (!hash && image.src && dataurl.toObject(image.src)) {
        const data = dataurl.toObject(image.src);
        if (!data) return;
        hash = await Sodium.hashFile({
          data: data.data,
          type: "base64",
          uri: ""
        });
        if (imageRef.current) {
          imageRef.current.hash = hash;
        }
      }
      if (!hash) return;
      //@ts-ignore // FIX ME
      const uri = await downloadAttachment(hash, false, {
        silent: true,
        cache: true
      });
      const path = `${cacheDir}/${uri}`;
      setImage("file://" + path);
      setLoading(false);
    }, 100);
  };

  const close = () => {
    setImage(undefined);
    setVisible(false);
  };

  return (
    visible && (
      <BaseDialog
        background="black"
        animation="slide"
        visible={true}
        onRequestClose={close}
        transparent
      >
        <View
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "black"
          }}
        >
          {loading || !image ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <ProgressBarComponent
                indeterminate
                color={colors.primary.accent}
                borderColor="transparent"
              />
              <IconButton
                onPress={() => {
                  if (imageRef.current?.hash) {
                    db.fs().cancel(imageRef.current?.hash);
                  }
                  close();
                }}
                style={{
                  position: "absolute",
                  top: Platform.OS === "android" ? 35 : 0,
                  right: 12
                }}
                color={colors.static.white}
                name="close"
              />
            </View>
          ) : (
            <ImageViewer
              enableImageZoom={true}
              renderIndicator={() => <></>}
              enableSwipeDown
              useNativeDriver
              onSwipeDown={close}
              saveToLocalByLongPress={false}
              renderHeader={() => (
                <View
                  style={{
                    flexDirection: "row",
                    width: "100%",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    height: 50,
                    paddingHorizontal: 24,
                    position: "absolute",
                    zIndex: 999,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    marginTop: Platform.OS === "android" ? 30 : 0
                  }}
                >
                  <IconButton
                    name="close"
                    color="white"
                    onPress={() => {
                      close();
                    }}
                  />
                </View>
              )}
              imageUrls={[
                {
                  url: image as string
                }
              ]}
            />
          )}
        </View>
      </BaseDialog>
    )
  );
};

export default ImagePreview;
