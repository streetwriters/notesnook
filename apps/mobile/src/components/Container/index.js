import React from 'react';
import {KeyboardAvoidingView, Platform, SafeAreaView} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTracked } from '../../provider';
import { getElevation } from '../../utils';
import { ContainerScale } from '../../utils/Animations';
import SelectionHeader from '../SelectionHeader';
import {ContainerTopSection} from './ContainerTopSection';
const AnimatedView = Animated.createAnimatedComponent(SafeAreaView);
export const Container = ({children, root}) => {
  const [state] = useTracked();
  const {colors, } = state;
  return (
    <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'}
      style={{
        backgroundColor:colors.nav,
        width:"100%",
        height:"100%"
      }}
    >
      <AnimatedView
        style={{
          height: '100%',
          backgroundColor:colors.bg,
          borderRadius:10,
          overflow:"hidden",
          transform:[
            {
              scale:ContainerScale
            }
          ]
        }}>
        <SelectionHeader />
        <ContainerTopSection root={root} />
        {children}
      </AnimatedView>
    </KeyboardAvoidingView>
  );
};

export default Container;
