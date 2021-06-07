import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTracked } from '../../provider';
import { ContainerScale } from '../../utils/Animations';
import useIsFloatingKeyboard from '../../utils/use-is-floating-keyboard';
const AnimatedView = Animated.createAnimatedComponent(SafeAreaView);
export const Container = ({children, root}) => {
  const [state] = useTracked();
  const {colors, } = state;
  const floating = useIsFloatingKeyboard();
  return (
    <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios' && !floating }
      style={{
        backgroundColor:colors.bg,
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
      
        {children}
      </AnimatedView>
    </KeyboardAvoidingView>
  );
};

export default Container;
