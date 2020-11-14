import React from 'react';
import { View } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Paragraph from '../../components/Typography/Paragraph';
import { useTracked } from '../../provider';
import { eSendEvent } from '../../services/EventManager';
import { eOnLoadNote } from '../../utils/Events';
import Editor from './index';

let prevVal = -80;
let finalValue = 0;
let anim2 = new Animated.Value(-80);
const op1 = new Animated.Value(1);
const op2 = new Animated.Value(0);
const op3 = new Animated.Value(0);
const onHandlerStateChange = (evt) => {
  if (evt.nativeEvent.state === State.END) {
    if (evt.nativeEvent.translationY >= finalValue) {
      console.log('I can be called too');
      eSendEvent(eOnLoadNote, {type: 'new'});
      opacityAnim(0, 1, 0);
      setTimeout(() => {
        animation(-80);
        setTimeout(() => {
          opacityAnim(1, 0, 0);
        }, 150);
      }, 200);
    } else {
      animation(-80);
      setTimeout(() => {
        opacityAnim(1, 0, 0);
      }, 150);
    }
  }
};

const onGestureEvent = (event) => {
  if (event.nativeEvent.translationY < 0) return;
  let v = -80 + event.nativeEvent.translationY;
  if (v >= 0 && prevVal !== 0) {
    prevVal = 0;
    animation(0);
    opacityAnim(0, 0, 1);

    return;
  }
  if (v >= 0) return;
  prevVal = v;
  anim2.setValue(v);
};

function animation(a) {
  Animated.timing(anim2, {
    toValue: a,
    duration: 150,
    easing: Easing.inOut(Easing.ease),
  }).start();
}

function opacityAnim(a, b, c) {
  Animated.timing(op1, {
    toValue: a,
    duration: 50,
    easing: Easing.inOut(Easing.ease),
  }).start();
  Animated.timing(op2, {
    toValue: b,
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  }).start();
  Animated.timing(op3, {
    toValue: c,
    duration: 300,
    easing: Easing.inOut(Easing.ease),
  }).start();
}

export const EditorWrapper = () => {
  const [state] = useTracked();
  const {colors} = state;
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
      }}>
      <PanGestureHandler
        minPointers={2}
        onHandlerStateChange={onHandlerStateChange}
        onGestureEvent={onGestureEvent}>
        <Animated.View
          style={{
            transform: [
              {
                translateY: anim2,
              },
            ],
            height: '100%',
            width: '100%',
          }}>
          <View
            style={{
              height: 80,
              backgroundColor: colors.accent,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
              transform: [
                {
                  translateY: insets.top,
                },
              ],
            }}>
            <Animated.Text
              style={{
                position: 'absolute',
                opacity: op1,
                bottom: 10,
              }}>
              <Paragraph color="white">
                Keep swiping down to start a new note.
              </Paragraph>
            </Animated.Text>

            <Animated.Text
              style={{
                position: 'absolute',
                opacity: op3,
              }}>
              <Paragraph color="white">Release to load new note</Paragraph>
            </Animated.Text>

            <Animated.Text
              style={{
                position: 'absolute',
                opacity: op2,
              }}>
              <Paragraph color="white">Loading a new note</Paragraph>
            </Animated.Text>
          </View>

          <View
            style={{
              height: '100%',
              width: '100%',
            }}>
            <Editor noMenu={false} />
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};
