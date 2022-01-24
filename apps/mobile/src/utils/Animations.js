import { Dimensions } from 'react-native';
import Animated, { Easing } from 'react-native-reanimated';
import { editing } from './index';

const { Value, timing } = Animated;

export const EditorPosition = new Value(0);
export const EditorScale = new Value(1);
export const EditorOpacity = new Value(0);
export const EditorTranslateY = new Value(Dimensions.get('window').height * 2);

export const anim1 = new Animated.Value(-Dimensions.get('window').height);
export let animInitialValue = -Dimensions.get('window').height;
export const opacityAnimSearch = new Animated.Value(1);
export const setAnimValue = value => (animInitialValue = value);

export let currentPage = 'main';
export function searchViewAnimation(translate, opacity, next, duration = 150) {
  currentPage = next;
  timing(anim1, {
    toValue: translate,
    duration: duration,
    easing: Easing.inOut(Easing.ease)
  }).start();
  timing(opacityAnimSearch, {
    toValue: opacity,
    duration: duration,
    easing: Easing.in(Easing.ease)
  }).start();
}

export function openEditorAnimation() {
  EditorTranslateY.setValue(Dimensions.get('window').height * 0.75);
  EditorOpacity.setValue(0);

  editing.currentlyEditing = true;

  timing(EditorTranslateY, {
    duration: 200,
    toValue: 0,
    easing: Easing.out(Easing.ease)
  }).start();
  timing(EditorOpacity, {
    duration: 150,
    toValue: 1,
    easing: Easing.out(Easing.ease)
  }).start();
}

export function exitEditorAnimation() {
  EditorOpacity.setValue(1);
  EditorTranslateY.setValue(0);
  editing.currentlyEditing = false;

  timing(EditorOpacity, {
    duration: 150,
    toValue: 0,
    easing: Easing.inOut(Easing.ease)
  }).start();
  timing(EditorTranslateY, {
    duration: 200,
    toValue: Dimensions.get('window').height * 2,
    easing: Easing.inOut(Easing.ease)
  }).start();
}

export const AppScale = new Animated.Value(0.95);
export const AppBorders = new Animated.Value(10);
export const ContainerScale = new Animated.Value(0.95);
export const EditorScalee = new Animated.Value(1);
export const DrawerScale = new Animated.Value(1);

export function changeContainerScale(op, scale, duration = 500, callback) {
  timing(op, {
    duration: duration,
    easing: Easing.out(Easing.ease),
    toValue: scale
  }).start(callback);
}

export function changeAppScale(scale, duration = 500, callback) {
  if (scale === 1) {
    timing(AppBorders, {
      duration: duration,
      easing: Easing.out(Easing.ease),
      toValue: 0
    }).start();
  } else {
    timing(AppBorders, {
      duration: duration,
      easing: Easing.out(Easing.ease),
      toValue: 10
    }).start();
  }

  timing(AppScale, {
    duration: duration,
    easing: Easing.out(Easing.ease),
    toValue: scale
  }).start(callback);
}
