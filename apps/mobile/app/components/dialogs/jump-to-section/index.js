import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { DDS } from "../../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import { useMessageStore } from "../../../stores/use-message-store";
import { useThemeStore } from "../../../stores/use-theme-store";
import { getElevation } from "../../../utils";
import {
  eCloseJumpToDialog,
  eOpenJumpToDialog,
  eScrollEvent
} from "../../../utils/events";
import { SIZE } from "../../../utils/size";
import BaseDialog from "../../dialog/base-dialog";
import { PressableButton } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";

const offsets = [];
let timeout = null;
const JumpToSectionDialog = ({ scrollRef, data, type }) => {
  const colors = useThemeStore((state) => state.colors);
  const notes = data;
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);

  const onPress = (item) => {
    let ind = notes.findIndex(
      (i) => i.title === item.title && i.type === "header"
    );
    console.log(scrollRef.current);
    scrollRef.current?.scrollToIndex({
      index: ind,
      animated: true
    });
    close();
  };

  useEffect(() => {
    eSubscribeEvent(eOpenJumpToDialog, open);
    eSubscribeEvent(eCloseJumpToDialog, close);
    eSubscribeEvent(eScrollEvent, onScroll);

    return () => {
      eUnSubscribeEvent(eOpenJumpToDialog, open);
      eUnSubscribeEvent(eCloseJumpToDialog, close);
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, []);

  const onScroll = (data) => {
    let y = data.y;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => {
      let index = offsets.findIndex((o, i) => o <= y && offsets[i + 1] > y);
      setCurrentIndex(index);
    }, 200);
  };

  const open = (_type) => {
    if (_type !== type) return;
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  useEffect(() => {
    loadOffsets();
  }, [notes]);

  const loadOffsets = () => {
    notes
      .filter((i) => i.type === "header")
      .map((item, index) => {
        let offset = 35 * index;
        let ind = notes.findIndex(
          (i) => i.title === item.title && i.type === "header"
        );
        let messageState = useMessageStore.getState().message;
        let msgOffset = messageState?.visible ? 60 : 10;
        ind = ind + 1;
        ind = ind - (index + 1);
        offset = offset + ind * 100 + msgOffset;
        offsets.push(offset);
      });
  };

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
          ...getElevation(5),
          width: DDS.isTab ? 500 : "85%",
          backgroundColor: colors.bg,
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
            {notes
              .filter((i) => i.type === "header")
              .map((item, index) => {
                return item.title ? (
                  <PressableButton
                    key={item.title}
                    onPress={() => onPress(item, index)}
                    type={currentIndex === index ? "accent" : "transparent"}
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
                        currentIndex === index ? colors.light : colors.accent
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
