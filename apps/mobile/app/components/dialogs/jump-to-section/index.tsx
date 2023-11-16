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

import { GroupHeader, Item, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React, {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { FlatList, ScrollView, View } from "react-native";
import { DDS } from "../../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import { useMessageStore } from "../../../stores/use-message-store";
import { getElevationStyle } from "../../../utils/elevation";
import {
  eCloseJumpToDialog,
  eOpenJumpToDialog,
  eScrollEvent
} from "../../../utils/events";
import { SIZE } from "../../../utils/size";
import BaseDialog from "../../dialog/base-dialog";
import { PressableButton } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";

const JumpToSectionDialog = () => {
  const scrollRef = useRef<RefObject<FlatList>>();
  const [data, setData] = useState<VirtualizedGrouping<Item>>();
  const { colors } = useThemeColors();
  const notes = data;
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const offsets = useRef<number[]>([]);
  const timeout = useRef<NodeJS.Timeout>();

  const onPress = (item: GroupHeader) => {
    const index = notes?.ids?.findIndex((i) => {
      if (typeof i === "object") {
        return i.title === item.title && i.type === "header";
      } else {
        false;
      }
    });
    scrollRef.current?.current?.scrollToIndex({
      index: index as number,
      animated: true
    });
    close();
  };

  const open = useCallback(
    ({
      data,
      ref
    }: {
      data: VirtualizedGrouping<Item>;
      ref: RefObject<FlatList>;
    }) => {
      setData(data);
      scrollRef.current = ref;
      setVisible(true);
    },
    []
  );

  useEffect(() => {
    eSubscribeEvent(eOpenJumpToDialog, open);
    eSubscribeEvent(eCloseJumpToDialog, close);
    eSubscribeEvent(eScrollEvent, onScroll);

    return () => {
      eUnSubscribeEvent(eOpenJumpToDialog, open);
      eUnSubscribeEvent(eCloseJumpToDialog, close);
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, [open]);

  const onScroll = (data: { x: number; y: number }) => {
    const y = data.y;
    if (timeout) {
      clearTimeout(timeout.current);
      timeout.current = undefined;
    }
    timeout.current = setTimeout(() => {
      setCurrentIndex(
        offsets.current?.findIndex(
          (o, i) => o <= y && offsets.current[i + 1] > y
        ) || 0
      );
    }, 200);
  };

  const close = () => {
    setVisible(false);
  };

  const loadOffsets = useCallback(() => {
    notes?.ids
      .filter((i) => typeof i === "object" && i.type === "header")
      .map((item, index) => {
        if (typeof item === "string") return;

        let offset = 35 * index;
        let ind = notes.ids.findIndex(
          (i) =>
            typeof i === "object" &&
            i.title === item.title &&
            i.type === "header"
        );
        const messageState = useMessageStore.getState().message;
        const msgOffset = messageState?.visible ? 60 : 10;

        ind = ind + 1;
        ind = ind - (index + 1);
        offset = offset + ind * 100 + msgOffset;
        offsets.current.push(offset);
      });
  }, [notes]);

  useEffect(() => {
    loadOffsets();
  }, [loadOffsets, notes]);

  return !visible ? null : (
    <BaseDialog
      onShow={() => {
        loadOffsets();
      }}
      onRequestClose={close}
      visible={true}
    >
      <View
        style={{
          ...getElevationStyle(5),
          width: DDS.isTab ? 500 : "85%",
          backgroundColor: colors.primary.background,
          zIndex: 100,
          bottom: 20,
          maxHeight: "65%",
          borderRadius: 10,
          alignSelf: "center",
          padding: 10,
          paddingTop: 30
        }}
      >
        <ScrollView
          style={{
            maxHeight: "100%"
          }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignSelf: "center",
              justifyContent: "center",
              paddingBottom: 20
            }}
          >
            {notes?.ids
              .filter((i) => typeof i === "object" && i.type === "header")
              .map((item, index) => {
                return typeof item === "object" && item.title ? (
                  <PressableButton
                    key={item.title}
                    onPress={() => onPress(item)}
                    type={currentIndex === index ? "selected" : "transparent"}
                    customStyle={{
                      minWidth: "20%",
                      width: null,
                      paddingHorizontal: 12,
                      margin: 5,
                      borderRadius: 100,
                      height: 25,
                      marginVertical: 10
                    }}
                  >
                    <Paragraph
                      size={SIZE.sm}
                      color={
                        currentIndex === index
                          ? colors.selected.accent
                          : colors.primary.accent
                      }
                      style={{
                        textAlign: "center"
                      }}
                    >
                      {item.title}
                    </Paragraph>
                  </PressableButton>
                ) : null;
              })}
          </View>
        </ScrollView>
      </View>
    </BaseDialog>
  );
};

export default JumpToSectionDialog;
