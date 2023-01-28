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
import { TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { notesnook } from "../../../e2e/test.ids";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import { DDS } from "../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { getElevation } from "../../utils";
import { eHideToast, eShowToast } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
export const Toast = ({ context = "global" }) => {
  const colors = useThemeColors();
  const [data, setData] = useState({});
  const insets = useGlobalSafeAreaInsets();
  const hideTimeout = useRef();
  const [visible, setVisible] = useState(false);
  const toastMessages = useRef([]);

  const show = useCallback(
    async (data) => {
      if (!data) return;
      if (data.context !== context) return;
      if (
        toastMessages.current.findIndex((m) => m.message === data.message) >= 0
      ) {
        return;
      }
      toastMessages.current.push(data);
      if (toastMessages.current?.length > 1) return;
      setData(data);

      setVisible(true);
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
      hideTimeout.current = setTimeout(() => {
        hide();
      }, data.duration);
    },
    [context, hide]
  );

  const next = useCallback(
    (data) => {
      if (!data) {
        hide();
        return;
      }
      setData(data);
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
      hideTimeout.current = setTimeout(() => {
        hide();
      }, data?.duration);
    },
    [hide]
  );

  const hide = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }
    let msg =
      toastMessages.current.length > 1 ? toastMessages.current.shift() : null;

    if (msg) {
      setVisible(false);
      next(msg);
      setTimeout(() => {
        setVisible(true);
      }, 300);
    } else {
      setVisible(false);
      toastMessages.current.shift();
      setTimeout(() => {
        setData({});
        if (hideTimeout.current) {
          clearTimeout(hideTimeout.current);
        }
      }, 100);
    }
  }, [next]);

  useEffect(() => {
    eSubscribeEvent(eShowToast, show);
    eSubscribeEvent(eHideToast, hide);
    return () => {
      toastMessages.current = [];
      eUnSubscribeEvent(eShowToast, show);
      eUnSubscribeEvent(eHideToast, hide);
    };
  }, [hide, show]);

  return (
    visible && (
      <TouchableOpacity
        onPress={hide}
        activeOpacity={1}
        style={{
          width: DDS.isTab ? 400 : "100%",
          alignItems: "center",
          alignSelf: "center",
          minHeight: 30,
          top: insets.top + 10,
          position: "absolute",
          zIndex: 999,
          elevation: 15
        }}
      >
        <View
          style={{
            ...getElevation(5),
            maxWidth: "95%",
            backgroundColor: colors.secondary.background,
            minWidth: data?.func ? "95%" : "50%",
            alignSelf: "center",
            borderRadius: 5,
            minHeight: 30,
            paddingVertical: 10,
            paddingLeft: 12,
            paddingRight: 5,
            justifyContent: "space-between",
            flexDirection: "row",
            alignItems: "center",
            width: "95%"
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexGrow: 1,
              flex: 1
            }}
          >
            <View
              style={{
                height: 30,
                borderRadius: 100,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 10
              }}
            >
              <Icon
                name={data?.type === "success" ? "check" : "close"}
                size={SIZE.lg}
                color={
                  data?.type === "error" ? colors.error.icon : colors.primary.accent
                }
              />
            </View>

            <View
              style={{
                flexGrow: 1,
                paddingRight: 25
              }}
            >
              {data?.heading ? (
                <Heading
                  color={colors.primary.paragraph}
                  size={SIZE.md}
                  onPress={() => {
                    hide();
                  }}
                >
                  {data.heading}
                </Heading>
              ) : null}

              {data?.message ? (
                <Paragraph
                  color={colors.primary.paragraph}
                  style={{
                    maxWidth: "100%",
                    paddingRight: 10
                  }}
                  onPress={() => {
                    hide();
                  }}
                >
                  {data.message}
                </Paragraph>
              ) : null}
            </View>
          </View>

          {data.func ? (
            <Button
              testID={notesnook.toast.button}
              fontSize={SIZE.md}
              type={data.type === "error" ? "errorShade" : "transparent"}
              onPress={data.func}
              title={data.actionText}
              height={30}
              style={{
                zIndex: 10
              }}
            />
          ) : null}
        </View>
      </TouchableOpacity>
    )
  );
};
