import { createRef } from 'react';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native';

export const sideMenuRef = createRef();
export const inputRef = createRef();
export const sideMenuOverlayRef = createRef();

export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

