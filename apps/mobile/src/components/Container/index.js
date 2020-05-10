import React from 'react';
import {KeyboardAvoidingView, Platform, SafeAreaView} from 'react-native';
import {useSafeArea} from 'react-native-safe-area-context';
import SelectionHeader from '../SelectionHeader';
import {ContainerBottomButton} from './ContainerBottomButton';
import {ContainerTopSection} from './ContainerTopSection';

export const Container = ({children,root}) => {
  const insets = useSafeArea();

  return (
    <KeyboardAvoidingView
      behavior="padding"
      enabled={Platform.OS === 'ios' ? true : false}>
      <SafeAreaView
        style={{
          height: '100%',
          paddingTop: insets.top,
        }}>
        <SelectionHeader />
        <ContainerTopSection root={root} />
        {children}
        <ContainerBottomButton root={root} />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Container;
