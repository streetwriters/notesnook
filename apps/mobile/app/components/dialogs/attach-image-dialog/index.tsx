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
import { formatBytes, useIsFeatureAvailable } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  TouchableOpacity,
  View
} from "react-native";
import { Image as ImageType } from "react-native-image-crop-picker";
import RNFetchBlob from "react-native-blob-util";
import { compressImage } from "../../../common/filesystem/compress";
import { presentSheet, ToastManager } from "../../../services/event-manager";
import { AppFontSize, defaultBorderRadius } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import { Notice } from "../../ui/notice";
import Paragraph from "../../ui/typography/paragraph";
import SettingsService from "../../../services/settings";

export type CompressedImageResult = {
  uri: string;
  size: number;
};

export type AttachImageResult = {
  compress: boolean;
  compressedImages?: Record<string, CompressedImageResult>;
};

export default function AttachImage({
  response,
  onAttach,
  close: _close
}: {
  response: ImageType[];
  onAttach: (result: AttachImageResult) => void;
  close: ((ctx?: string | undefined) => void) | undefined;
}) {
  const fullQualityImagesResult = useIsFeatureAvailable("fullQualityImages");
  const { colors } = useThemeColors();
  const [compress, setCompress] = useState(true);
  const [compressedMap, setCompressedMap] = useState<
    Record<string, CompressedImageResult>
  >({});
  const [isCompressing, setIsCompressing] = useState(true);
  const createdTempFilesRef = useRef<string[]>([]);
  const confirmedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    setIsCompressing(true);

    const runCompression = async () => {
      for (const item of response) {
        const isPng = /(png)/i.test(item.mime || item.path);
        const isJpeg = /(jpeg|jpg)/i.test(item.mime || item.path);

        if (isPng || isJpeg) {
          try {
            const inputPath =
              Platform.OS === "ios" && !item.path.startsWith("file://")
                ? "file://" + item.path
                : item.path;

            const res = await compressImage(inputPath, isPng ? "PNG" : "JPEG");
            if (!isMounted) {
              RNFetchBlob.fs
                .unlink(res.uri.replace("file://", ""))
                .catch(() => { });
              return;
            }

            createdTempFilesRef.current.push(res.uri.replace("file://", ""));
            if (isMounted) {
              setCompressedMap((prev) => ({
                ...prev,
                [item.path]: {
                  uri: res.uri,
                  size: res.size
                }
              }));
            }
          } catch (e) {
            console.error("Failed to pre-compress image", e);
          }
        }
      }

      if (isMounted) {
        setIsCompressing(false);
      }
    };

    runCompression();

    const tempFiles = createdTempFilesRef.current;
    return () => {
      isMounted = false;
      if (!confirmedRef.current) {
        for (const tempPath of tempFiles) {
          RNFetchBlob.fs.unlink(tempPath).catch(() => { });
        }
      }
    };
  }, [response]);

  const totalSize = useMemo(() => {
    return response.reduce((acc, item) => {
      const size = compress
        ? (compressedMap[item.path]?.size ?? item.size ?? 0)
        : (item.size ?? 0);
      return acc + size;
    }, 0);
  }, [response, compress, compressedMap]);

  return (
    <View
      style={{
        alignItems: "center",
        paddingHorizontal: DefaultAppStyles.GAP
      }}
    >
      <View
        style={{
          backgroundColor: colors.secondary.background,
          marginBottom: DefaultAppStyles.GAP_VERTICAL,
          height: 140,
          width: "100%",
          borderRadius: 10,
          padding: DefaultAppStyles.GAP_SMALL,
          paddingHorizontal: DefaultAppStyles.GAP_SMALL
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: DefaultAppStyles.GAP_VERTICAL_SMALL
          }}
        >
          <Paragraph
            style={{
              color: colors.primary.paragraph
            }}
          >
            {strings.attachImageHeading(response?.length || 1)}
          </Paragraph>
          <Paragraph
            size={AppFontSize.xs}
            style={{
              color: colors.secondary.paragraph
            }}
          >
            {isCompressing && compress
              ? `${strings.compressing()}...`
              : formatBytes(totalSize)}
          </Paragraph>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {response?.map?.((item) => {
            const itemSize = compress
              ? (compressedMap[item.path]?.size ?? item.size)
              : item.size;

            return (
              <TouchableOpacity
                key={item.filename || item.path}
                activeOpacity={0.9}
                style={{
                  marginRight: 6
                }}
              >
                <Image
                  source={{
                    uri:
                      Platform.OS === "ios"
                        ? item.sourceURL || item.path
                        : item.path
                  }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: defaultBorderRadius,
                    backgroundColor: "black"
                  }}
                  resizeMode="cover"
                />
                {itemSize && response.length > 1 ? (
                  <View
                    style={{
                      position: "absolute",
                      bottom: 4,
                      left: 4,
                      right: 4,
                      backgroundColor: "rgba(0,0,0,0.65)",
                      borderRadius: 4,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      alignItems: "center"
                    }}
                  >
                    <Paragraph
                      size={AppFontSize.xxs}
                      style={{ color: "#ffffff" }}
                      numberOfLines={1}
                    >
                      {isCompressing && compress && !compressedMap[item.path]
                        ? `${strings.compressing()}...`
                        : formatBytes(itemSize)}
                    </Paragraph>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity
        activeOpacity={1}
        style={{
          flexDirection: "row",
          alignSelf: "center",
          marginBottom: DefaultAppStyles.GAP_VERTICAL,
          alignItems: "center",
          width: "100%",
          opacity: fullQualityImagesResult?.isAllowed ? 1 : 0.5
        }}
        onPress={() => {
          if (!fullQualityImagesResult?.isAllowed) {
            ToastManager.show({
              message: fullQualityImagesResult?.error,
              type: "info",
              context: "local"
            });
            return;
          }
          setCompress(!compress);
        }}
      >
        <IconButton
          size={AppFontSize.lg}
          name={compress ? "checkbox-marked" : "checkbox-blank-outline"}
          color={
            compress && fullQualityImagesResult?.isAllowed
              ? colors.primary.accent
              : colors.primary.icon
          }
          style={{
            width: 25,
            height: 25
          }}
          onPress={() => {
            if (!fullQualityImagesResult?.isAllowed) {
              ToastManager.show({
                message: fullQualityImagesResult?.error,
                type: "info",
                context: "local"
              });
              return;
            }
            setCompress(!compress);
          }}
        />

        <Paragraph
          style={{
            flexShrink: 1,
            marginLeft: 3
          }}
          size={AppFontSize.sm}
        >
          {strings.compress()} ({strings.recommended().toLowerCase()})
        </Paragraph>
      </TouchableOpacity>

      {!compress ? (
        <Notice
          type="alert"
          text={strings.compressionOffNotice()}
          size="small"
          style={{
            width: "100%",
            marginBottom: DefaultAppStyles.GAP_VERTICAL
          }}
        />
      ) : (
        <Notice
          type="information"
          text={strings.compressionOnNotice()}
          size="small"
          style={{
            width: "100%",
            marginBottom: DefaultAppStyles.GAP_VERTICAL
          }}
        />
      )}

      <Button
        title={strings.attachImageHeading(response?.length || 1)}
        type="accent"
        width="100%"
        loading={isCompressing && compress}
        disabled={isCompressing && compress}
        onPress={() => {
          if (compress) {
            confirmedRef.current = true;
          }
          onAttach({
            compress,
            compressedImages: compress ? compressedMap : undefined
          });
        }}
      />
    </View>
  );
}

AttachImage.present = (response: ImageType[], context?: string) => {
  return new Promise<AttachImageResult | undefined>((resolve) => {
    let resolved = false;

    const imageCompressionSetting =
      SettingsService.getProperty("imageCompression");

    if (imageCompressionSetting !== "ask-every-time") {
      resolve({
        compress: imageCompressionSetting === "enabled" ? true : false
      });
      return;
    }

    presentSheet({
      context: context,
      component: (ref, close, _update) => (
        <AttachImage
          response={response}
          close={close}
          onAttach={(result) => {
            resolved = true;

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
