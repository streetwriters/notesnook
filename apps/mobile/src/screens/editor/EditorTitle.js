import React, { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { useThemeStore } from '../../stores/theme';
import { SIZE } from '../../utils/size';
import { post, _onMessage } from './Functions';

export const EditorTitle = () => {
  const colors = useThemeStore(state => state.colors);
  const [title, setTitle] = useState(null);
  const [show, setShow] = useState(false);
  const onScroll = async data => {
    if (data.visible === undefined || data.visible === null) return;
    if (data.visible > 190) {
      setShow(true);
    } else {
      setShow(false);
    }
    if (title !== data.title) {
      setTitle(data.title);
    }
  };

  useEffect(() => {
    eSubscribeEvent('editorScroll', onScroll);
    return () => {
      eUnSubscribeEvent('editorScroll', onScroll);
    };
  }, []);

  return show ? (
    <Animated.View
      entering={FadeInUp}
      exiting={FadeOutUp}
      style={{
        paddingLeft: 0
      }}
    >
      <TextInput
        defaultValue={title}
        style={{
          fontFamily: 'OpenSans-SemiBold',
          fontSize: SIZE.xl,
          color: colors.heading,
          padding: 0,
          flexShrink: 1,
          flexWrap: 'wrap'
        }}
        placeholder="Note title"
        placeholderTextColor={colors.placeholder}
        onChangeText={text => {
          setTitle(text);
          post('title', text);
          _onMessage({
            nativeEvent: {
              data: JSON.stringify({
                type: 'title',
                value: text
              })
            }
          });
        }}
      />
    </Animated.View>
  ) : (
    <View />
  );
};
