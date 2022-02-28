import React, { useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { useTracked } from '../../provider';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { post, _onMessage } from './Functions';

const opacityVal = new Animated.Value(0);
const translateY = new Animated.Value(-700);
function animation(v) {
  Animated.timing(opacityVal, {
    toValue: v,
    duration: 150,
    easing: Easing.inOut(Easing.ease)
  }).start();
}

export const EditorTitle = () => {
  const [state] = useTracked();
  const { colors } = state;
  const [title, setTitle] = useState(null);
  const onScroll = async data => {
    if (data.visible === undefined || data.visible === null) return;
    if (data.visible > 190) {
      translateY.setValue(0);
      await sleep(5);
      animation(1);
    } else {
      animation(0);
      await sleep(150);
      translateY.setValue(-700);
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

  return (
    <Animated.View
      style={{
        opacity: opacityVal,
        paddingLeft: 0,
        transform: [
          {
            translateY: translateY
          }
        ]
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
  );
};
