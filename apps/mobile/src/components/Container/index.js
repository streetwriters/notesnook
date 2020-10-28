import React from 'react';
import {KeyboardAvoidingView, Platform, SafeAreaView} from 'react-native';
import {initialWindowMetrics} from 'react-native-safe-area-context';
import SelectionHeader from '../SelectionHeader';
import {ContainerTopSection} from './ContainerTopSection';

export const Container = ({children, root}) => {
  return (
    <KeyboardAvoidingView
      behavior="padding"
      enabled={Platform.OS === 'ios' ? true : false}>
      <SafeAreaView
        style={{
          height: '100%',
          paddingTop: initialWindowMetrics.insets.top,
        }}>
        <SelectionHeader />
        <ContainerTopSection root={root} />
        {children}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Container;
