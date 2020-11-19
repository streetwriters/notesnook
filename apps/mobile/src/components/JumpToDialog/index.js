import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import BaseDialog from '../../components/Dialog/base-dialog';
import { PressableButton } from '../../components/PressableButton';
import Seperator from '../../components/Seperator';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { getElevation, scrollRef } from '../../utils';
import { eCloseJumpToDialog, eOpenJumpToDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const offsets = [];
let timeout = null;
const JumpToDialog = () => {
  const [state] = useTracked();
  const {notes, colors, settings} = state;
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(null);

  const onPress = (item, index) => {
    let offset = 35 * index;
    let ind = notes.findIndex(
      (i) => i.title === item.title && i.type === 'header',
    );
    ind = ind + 1;
    ind = ind - (index + 1);
    offset = offset + ind * 100 + 200;
    scrollRef.current?.scrollToOffset(0, index === 0 ? 0 : offset, true);
    close();
  };

  useEffect(() => {
    eSubscribeEvent(eOpenJumpToDialog, open);
    eSubscribeEvent(eCloseJumpToDialog, close);
    //eSubscribeEvent(eScrollEvent, onScroll);

    return () => {
      eUnSubscribeEvent(eOpenJumpToDialog, open);
      eUnSubscribeEvent(eCloseJumpToDialog, close);
      //eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, []);

  const onScroll = (y) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => {
      let index = offsets.findIndex((o, i) => o <= y && offsets[i + 1] > y);
      //setCurrentIndex(index);
    }, 100);
  };

  const open = () => {
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
      .filter((i) => i.type === 'header')
      .map((item, index) => {
        let offset = 35 * index;
        let ind = notes.findIndex(
          (i) => i.title === item.title && i.type === 'header',
        );
        ind = ind + 1;
        ind = ind - (index + 1);
        offset = offset + ind * 100 + 200;

        offsets.push(offset);
      });
  };

  return (
    <BaseDialog
      onShow={() => {
        loadOffsets();
      }}
      onRequestClose={close}
      visible={visible}>
      <View
        style={{
          ...getElevation(5),
          width: DDS.isTab ? 500 : '80%',
          backgroundColor: colors.bg,
          zIndex: 100,
          bottom: 20,
          maxHeight: '65%',
          borderRadius: 5,
          alignSelf: 'center',
          padding: 10,
        }}>
        <Heading
          size={SIZE.xl}
          style={{
            alignSelf: 'center',
          }}>
          {settings.sort.slice(0, 1).toUpperCase() +
            settings.sort.slice(1, settings.sort.length)}
        </Heading>
        <Seperator />
        <ScrollView
          style={{
            maxHeight: '100%',
          }}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignSelf: 'center',
              justifyContent: 'center',
            }}>
            {notes
              .filter((i) => i.type === 'header')
              .map((item, index) => (
                <PressableButton
                  key={item.title}
                  onPress={() => onPress(item, index)}
                  color={currentIndex === index ? colors.shade : 'transparent'}
                  selectedColor={
                    currentIndex === index ? colors.accent : colors.nav
                  }
                  alpha={!colors.night ? -0.02 : 0.02}
                  opacity={currentIndex === index ? 0.12 : 1}
                  customStyle={{
                    minWidth: '20%',
                    maxWidth: '46%',
                    width: null,
                    padding: 15,
                    margin: 5,
                  }}>
                  <Paragraph
                    size={SIZE.xs}
                    color={currentIndex === index ? colors.accent : null}
                    style={{
                      textAlign: 'center',
                    }}>
                    {item.title}
                  </Paragraph>
                </PressableButton>
              ))}
          </View>
        </ScrollView>
      </View>
    </BaseDialog>
  );
};

export default JumpToDialog;
