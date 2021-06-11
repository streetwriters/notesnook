import React from 'react';
import { SafeAreaView } from 'react-native';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useTracked } from '../../provider';
import useIsFloatingKeyboard from '../../utils/use-is-floating-keyboard';
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
      <SafeAreaView
        style={{
          height: '100%',
          backgroundColor:colors.bg,
          overflow:"hidden",
        }}>
      
        {children}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Container;
