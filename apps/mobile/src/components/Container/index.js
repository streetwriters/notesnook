import React from 'react';
import {KeyboardAvoidingView, Platform, SafeAreaView} from 'react-native';
import { useTracked } from '../../provider';
import SelectionHeader from '../SelectionHeader';
import {ContainerTopSection} from './ContainerTopSection';

export const Container = ({children, root}) => {
  const [state] = useTracked();
  const {colors, } = state;
  return (
    <KeyboardAvoidingView behavior="padding" enabled={Platform.OS === 'ios'}>
      <SafeAreaView
        style={{
          height: '100%',
          backgroundColor:colors.bg,
        }}>
        <SelectionHeader />
        <ContainerTopSection root={root} />
        {children}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Container;
