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
import { ActivityIndicator, FlatList, ScrollView, View } from "react-native";
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
import { AppFontSize } from "../../../utils/size";
import BaseDialog from "../../dialog/base-dialog";
import { Pressable } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";

const JumpToSectionDialog = () => {
  const scrollRef = useRef<RefObject<FlatList>>();
  const [data, setData] = useState<VirtualizedGrouping<Item>>();
  const { colors } = useThemeColors();
  const notes = data;
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentScrollPosition = useRef(0);
  const [loading, setLoading] = useState(false);

  const [groups, setGroups] = useState<
    {
      index: number;
      group: GroupHeader;
    }[]
  >();
  const offsets = useRef<number[]>([]);

  const onPress = (item: { index: number; group: GroupHeader }) => {
    scrollRef.current?.current?.scrollToIndex({
      index: item.index,
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
      setLoading(true);
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
    currentScrollPosition.current = data.y;
  };

  const close = () => {
    setVisible(false);
  };

  const loadGroupsAndOffsets = useCallback(() => {
    notes?.groups?.().then((groups) => {
      setGroups(groups);
      offsets.current = [];
      groups.map((item, index) => {
        let offset = 35 * index;
        let groupIndex = item.index;
        const messageState = useMessageStore.getState().message;
        const msgOffset = messageState?.visible ? 60 : 10;

        groupIndex = groupIndex + 1;
        groupIndex = groupIndex - (index + 1);
        offset = offset + groupIndex * 100 + msgOffset;
        offsets.current.push(offset);
      });

      const index = offsets.current?.findIndex((o, i) => {
        return (
          o <= currentScrollPosition.current + 100 &&
          offsets.current[i + 1] - 100 > currentScrollPosition.current
        );
      });

      setCurrentIndex(index < 0 ? 0 : index);
      setLoading(false);
    });
  }, [notes]);

  return !visible ? null : (
    <BaseDialog
      onShow={() => {
        loadGroupsAndOffsets();
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
        {loading ? (
          <ActivityIndicator
            size={AppFontSize.lg}
            color={colors.primary.accent}
            style={{
              marginBottom: 20
            }}
          />
        ) : (
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
              {groups?.map((item, index) => {
                return (
                  <Pressable
                    key={item.group.id}
                    onPress={() => onPress(item)}
                    type={currentIndex === index ? "accent" : "transparent"}
                    style={{
                      minWidth: "20%",
                      width: null,
                      paddingHorizontal: 12,
                      margin: 5,
                      borderRadius: 100,
                      height: 30,
                      marginVertical: 10
                    }}
                  >
                    <Paragraph
                      size={AppFontSize.sm}
                      color={
                        currentIndex === index
                          ? colors.static.white
                          : colors.primary.paragraph
                      }
                      style={{
                        textAlign: "center"
                      }}
                    >
                      {item.group.title}
                    </Paragraph>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </BaseDialog>
  );
};

export default JumpToSectionDialog;
