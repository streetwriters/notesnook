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
import { ActivityIndicator, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { editorState } from "../../screens/editor/tiptap/utils";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { eCloseSheet, eOpenSheet } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
import SheetWrapper from "../ui/sheet";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
const SheetProvider = ({ context = "global" }) => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState(null);
  const actionSheetRef = useRef();
  const editor = useRef({
    refocus: false
  });

  useEffect(() => {
    eSubscribeEvent(eOpenSheet, open);
    eSubscribeEvent(eCloseSheet, close);
    return () => {
      eUnSubscribeEvent(eOpenSheet, open);
      eUnSubscribeEvent(eCloseSheet, close);
    };
  }, [close, open, visible]);

  const open = useCallback(
    async (payload) => {
      if (!payload.context) payload.context = "global";
      if (payload.context !== context) return;
      setData((state) => {
        if (state?.onClose) state.onClose();
        return payload;
      });
      setVisible(true);
      if (payload.editor) {
        editor.current.refocus = false;
        if (editorState().keyboardState) {
          editor.current.refocus = true;
        }
      }
    },
    [context]
  );

  useEffect(() => {
    (async () => {
      if (visible && data) {
        if (data.editor) await sleep(100);
        actionSheetRef.current?.setModalVisible(true);
        return;
      } else {
        if (editor.current?.refocus) {
          editorState().isFocused = true;
          editor.current.refocus = false;
        }
      }
    })();
  }, [visible, data]);

  const close = useCallback(
    (ctx) => {
      if (!ctx) ctx = "global";
      if (ctx !== context) return;
      actionSheetRef.current?.setModalVisible(false);
    },
    [context]
  );

  return !visible || !data ? null : (
    <SheetWrapper
      fwdRef={actionSheetRef}
      gestureEnabled={!data?.progress && !data?.disableClosing}
      closeOnTouchBackdrop={!data?.progress && !data?.disableClosing}
      onClose={() => {
        data.onClose && data.onClose();
        setVisible(false);
        setData(null);
      }}
      keyboardHandlerDisabled={data?.keyboardHandlerDisabled}
      bottomPadding={!data.noBottomPadding}
      enableGesturesInScrollView={
        typeof data.enableGesturesInScrollView === "undefined"
          ? true
          : data.enableGesturesInScrollView
      }
    >
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          marginBottom:
            !data.progress && !data.icon && !data.title && !data.paragraph
              ? 0
              : 10,
          paddingHorizontal: 12
        }}
      >
        {data?.progress ? (
          <ActivityIndicator
            style={{
              marginTop: 15
            }}
            size={50}
            color={colors.primary.accent}
          />
        ) : null}

        {data?.icon ? (
          <Icon
            color={colors[data.iconColor] || colors.primary.accent}
            name={data.icon}
            size={50}
          />
        ) : null}

        {data?.title ? <Heading> {data?.title}</Heading> : null}

        {data?.paragraph ? (
          <Paragraph style={{ textAlign: "center" }}>
            {data?.paragraph}
          </Paragraph>
        ) : null}
      </View>

      {typeof data.component === "function"
        ? data.component(
            actionSheetRef,
            () => close(context),
            (data) => {
              if (!data) return;
              setData((prevData) => {
                return {
                  ...prevData,
                  ...data
                };
              });
            },
            colors
          )
        : data.component}

      <View
        style={{
          paddingHorizontal: 12,
          marginBottom: data.valueArray ? 12 : 0
        }}
      >
        {data.valueArray &&
          data.valueArray.map((v) => (
            <Button
              title={v}
              type="plain"
              key={v}
              textStyle={{ fontWeight: "normal" }}
              fontSize={AppFontSize.sm}
              icon="check"
              width="100%"
              style={{
                justifyContent: "flex-start",
                backgroundColor: "transparent"
              }}
            />
          ))}
      </View>

      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        {data?.action ? (
          <Button
            onPress={data.action}
            key={data.actionText}
            title={data.actionText}
            accentColor={data.iconColor}
            type="accent"
            height={40}
            width={250}
            style={{
              marginBottom: 25
            }}
          />
        ) : null}

        {data?.actionsArray &&
          data?.actionsArray.map((item) => (
            <Button
              onPress={item.action}
              key={item.accentText}
              title={item.actionText}
              icon={item.icon && item.icon}
              type={item.type || "accent"}
              style={{
                marginBottom: 10
              }}
              width="100%"
              fontSize={AppFontSize.md}
            />
          ))}

        {data?.learnMore ? (
          <Paragraph
            style={{
              alignSelf: "center",
              marginTop: 10,
              textDecorationLine: "underline"
            }}
            size={AppFontSize.xs}
            onPress={data.learnMorePress}
            color={colors.secondary.paragraph}
          >
            <Icon
              color={colors.primary.icon}
              name="information-outline"
              size={AppFontSize.xs}
            />{" "}
            {data.learnMore}
          </Paragraph>
        ) : null}
      </View>
    </SheetWrapper>
  );
};

export default SheetProvider;
