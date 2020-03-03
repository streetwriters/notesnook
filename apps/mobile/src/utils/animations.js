import Animated, {Easing} from 'react-native-reanimated';
import {Dimensions} from 'react-native';

const {color, Value, timing} = Animated;

export const EditorPosition = new Value(Dimensions.get('window').width * 1.5);

export function openEditorAnimation() {
  let openConfigH = {
    duration: 300,
    toValue: 0,
    easing: Easing.inOut(Easing.ease),
  };
  timing(EditorPosition, openConfigH).start();
}

export function exitEditorAnimation() {
  let openConfigH = {
    duration: 300,
    toValue: Dimensions.get('window').width * 1.5,
    easing: Easing.inOut(Easing.ease),
  };
  timing(EditorPosition, openConfigH).start();
}

export const slideRight = {
  0: {
    transform: [{translateX: -4}],
  },
  0.5: {
    transform: [{translateX: 0}],
  },
  1: {
    transform: [{translateX: 4}],
  },
};
export const slideLeft = {
  0: {
    transform: [{translateX: 4}],
  },
  0.5: {
    transform: [{translateX: 0}],
  },
  1: {
    transform: [{translateX: -4}],
  },
};

export const rotate = {
  0: {
    transform: [{rotateZ: '0deg'}, {translateX: 0}, {translateY: 0}],
  },
  0.5: {
    transform: [{rotateZ: '25deg'}, {translateX: 10}, {translateY: -20}],
  },
  1: {
    transform: [{rotateZ: '45deg'}, {translateX: 10}, {translateY: -20}],
  },
};

export const deleteItems = (tX, tY) => {
  return {
    0: {
      transform: [
        {translateX: tX},
        {translateY: tY},
        {scaleX: 0.6},
        {scaleY: 0.6},
      ],
      opacity: 0,
    },
    0.3: {
      transform: [
        {translateX: 0},
        {translateY: 0},
        {scaleX: 0.8},
        {scaleY: 0.8},
      ],
      opacity: 0.7,
    },
    0.5: {
      transform: [{translateX: 0}, {translateY: 50}, {scaleX: 1}, {scaleY: 1}],
      opacity: 0.9,
    },
    1: {
      transform: [
        {translateX: 0},
        {translateY: 110},
        {scaleX: 0.6},
        {scaleY: 0.6},
      ],
      opacity: 0,
    },
  };
};

export const opacity = {
  0: {
    opacity: 0,
  },

  1: {
    opacity: 1,
  },
};
