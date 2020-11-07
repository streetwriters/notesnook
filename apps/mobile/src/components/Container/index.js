import React from 'react';
import {KeyboardAvoidingView, Platform, SafeAreaView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SelectionHeader from '../SelectionHeader';
import {ContainerTopSection} from './ContainerTopSection';

export const Container = ({children, root}) => {
  const  insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      behavior="padding"
      enabled={Platform.OS === 'ios'}>
      <SafeAreaView
        style={{
          height: '100%',
          paddingTop: insets.top,
        }}>
        <SelectionHeader />
        <ContainerTopSection root={root} />
        {children}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Container;
