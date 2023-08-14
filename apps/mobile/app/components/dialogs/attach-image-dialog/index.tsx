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
import React, { useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { ImagePickerResponse } from "react-native-image-picker";
import { useThemeColors } from "../../../../../../packages/theme/dist";
import { presentSheet } from "../../../services/event-manager";
import { SIZE } from "../../../utils/size";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { Notice } from "../../ui/notice";
import Paragraph from "../../ui/typography/paragraph";

export default function AttachImage({
  response,
  onAttach,
  close
}: {
  response: ImagePickerResponse;
  onAttach: ({ compress }: { compress: boolean }) => void;
  close: ((ctx?: string | undefined) => void) | undefined;
}) {
  const { colors } = useThemeColors();
  const [compress, setCompress] = useState(true);
  const image = response.assets?.[0];
  const width = image?.width || 0;
  const height = image?.height || 0;
  const ratio = width / height;

  return (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: 12
      }}
    >
      {image ? (
        <View
          style={{
            width: "100%",
            borderRadius: 10,
            backgroundColor: "black",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10
          }}
        >
          <Image
            source={{
              uri: image.uri
            }}
            resizeMode="contain"
            style={{
              width: 300 * ratio,
              height: (300 * ratio) / ratio,
              backgroundColor: "black"
            }}
          />
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={1}
        style={{
          flexDirection: "row",
          alignSelf: "center",
          marginBottom: 12,
          alignItems: "center",
          width: "100%"
        }}
        onPress={() => {
          setCompress(!compress);
        }}
      >
        <IconButton
          size={SIZE.lg}
          name={compress ? "checkbox-marked" : "checkbox-blank-outline"}
          color={compress ? colors.primary.accent : colors.primary.icon}
          customStyle={{
            width: 25,
            height: 25
          }}
          onPress={() => {
            setCompress(!compress);
          }}
        />

        <Paragraph
          style={{
            flexShrink: 1,
            marginLeft: 3
          }}
          size={SIZE.sm}
        >
          Compress image (recommended)
        </Paragraph>
      </TouchableOpacity>

      {!compress ? (
        <Notice
          type="alert"
          text="Images uploaded without compression are slow to load and take more bandwidth. We recommend compressing images unless you need image in original quality."
          size="small"
          style={{
            width: "100%",
            marginBottom: 12
          }}
        />
      ) : (
        <Notice
          type="information"
          text="Compressed images are uploaded in FULL HD resolution and are good enough for most use cases."
          size="small"
          style={{
            width: "100%",
            marginBottom: 12
          }}
        />
      )}

      <Button
        title="Add image"
        type="accent"
        width="100%"
        onPress={() => {
          onAttach({
            compress
          });
        }}
      />
    </View>
  );
}

AttachImage.present = (response: ImagePickerResponse) => {
  return new Promise((resolve) => {
    let resolved = false;
    presentSheet({
      component: (ref, close, update) => (
        <AttachImage
          response={response}
          close={close}
          onAttach={(result) => {
            resolved = true;
            console.log("closing");
            resolve(result);
            close?.();
          }}
        />
      ),
      onClose: () => {
        if (resolved) return;
        resolve(undefined);
      }
    });
  });
};
