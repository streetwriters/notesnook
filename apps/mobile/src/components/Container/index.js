import React from 'react';
import {KeyboardAvoidingView, Platform, SafeAreaView} from 'react-native';
import SelectionHeader from '../SelectionHeader';
import {ContainerTopSection} from './ContainerTopSection';

export const Container = ({children, root}) => {

  return (
    <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'}>
      <SafeAreaView
        style={{
          height: '100%',
        }}>
        <SelectionHeader />
        <ContainerTopSection root={root} />
        {children}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Container;
