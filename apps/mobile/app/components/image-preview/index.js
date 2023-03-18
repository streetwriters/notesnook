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

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";
import downloadAttachment from "../../common/filesystem/download-attachment";
import { cacheDir } from "../../common/filesystem/utils";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import BaseDialog from "../dialog/base-dialog";
import { IconButton } from "../ui/icon-button";
import { ProgressBarComponent } from "../ui/svg/lazy";

const ImagePreview = () => {
  const colors = useThemeStore((state) => state.colors);
  const [visible, setVisible] = useState(false);
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    eSubscribeEvent("ImagePreview", open);

    return () => {
      eUnSubscribeEvent("ImagePreview", open);
    };
  }, []);

  const open = async (image) => {
    setVisible(true);
    setLoading(true);
    setTimeout(async () => {
      const hash = image.hash;
      const uri = await downloadAttachment(hash, false, {
        silent: true,
        cache: true
      });
      const path = `${cacheDir}/${uri}`;
      console.log(path);
      setImage("file://" + path);
      setLoading(false);
    }, 100);
  };

  const close = () => {
    setImage(null);
    setVisible(false);
  };

  return (
    visible && (
      <BaseDialog animation="slide" visible={true} onRequestClose={close}>
        <View
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "black"
          }}
        >
          {loading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <ProgressBarComponent
                indeterminate
                color={colors.accent}
                borderColor="transparent"
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
                    height: 80,
                    marginTop: 0,
                    paddingHorizontal: 12,
                    position: "absolute",
                    zIndex: 999,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    paddingTop: 30
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
                  url: image
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
