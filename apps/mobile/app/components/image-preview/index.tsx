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
import { DataURL, getFileNameWithExtension } from "@notesnook/core";
import type { ImageAttributes } from "@notesnook/editor";
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
import RNFetchBlob from "react-native-blob-util";
import Share from "react-native-share";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { useSettingStore } from "../../stores/use-setting-store";

const ImagePreview = () => {
  const { colors } = useThemeColors("dialog");

  const [visible, setVisible] = useState(false);
  const [image, setImage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const imageRef = useRef<ImageAttributes>();
  const insets = useGlobalSafeAreaInsets();
  const [showHeader, setShowHeader] = useState(true);

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
      if (!hash && image.src && DataURL.toObject(image.src)) {
        const data = DataURL.toObject(image.src);
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

      if (!uri) {
        setLoading(false);
        return;
      }
      const attachment = await db.attachments.attachment(hash);
      const path = `${cacheDir}/${
        "NN_" + (await getFileNameWithExtension(hash, attachment?.mimeType))
      }`;
      await RNFetchBlob.fs.mv(`${cacheDir}/${uri}`, path).catch(() => {
        /* empty */
      });
      setImage("file://" + path);
      setLoading(false);
    }, 100);
  };

  const close = React.useCallback(() => {
    image &&
      RNFetchBlob.fs.unlink(image.replace("file://", "")).catch(() => {
        /* empty */
      });
    setImage(undefined);
    setVisible(false);
  }, [image]);

  const renderHeader = React.useCallback(
    () => (
      <View
        style={{
          paddingTop: insets.top,
          backgroundColor: "rgba(0,0,0,0.3)",
          position: "absolute",
          zIndex: 999,
          display: showHeader ? "flex" : "none"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            justifyContent: "flex-end",
            alignItems: "center",
            height: 50,
            paddingHorizontal: 12,
            gap: 10
          }}
        >
          <IconButton
            name="share"
            color="white"
            style={{
              borderWidth: 0
            }}
            onPress={async () => {
              useSettingStore
                .getState()
                .setAppDidEnterBackgroundForAction(true);
              await Share.open({
                url: image
              }).catch(() => {
                /* empty */
              });
              useSettingStore
                .getState()
                .setAppDidEnterBackgroundForAction(false);
            }}
          />
          <IconButton
            name="close"
            color="white"
            onPress={() => {
              close();
            }}
          />
        </View>
      </View>
    ),
    [close, image, insets.top, showHeader]
  );

  return (
    visible && (
      <BaseDialog
        background="black"
        animation="slide"
        visible={true}
        useSafeArea={false}
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
            <>
              <ImageViewer
                enableImageZoom={true}
                renderIndicator={() => <></>}
                enableSwipeDown
                useNativeDriver
                onSwipeDown={close}
                saveToLocalByLongPress={false}
                onClick={() => {
                  setShowHeader(!showHeader);
                }}
                renderHeader={renderHeader}
                imageUrls={[
                  {
                    url: image as string
                  }
                ]}
              />
            </>
          )}
        </View>
      </BaseDialog>
    )
  );
};

export default ImagePreview;
