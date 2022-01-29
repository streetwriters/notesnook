import React, { useEffect } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  useWindowDimensions,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Editor from '.';
import { PremiumToast } from '../../components/Premium/premium-toast';
import { useTracked } from '../../provider';
import { useNoteStore, useSettingStore } from '../../provider/stores';
import { DDS } from '../../services/DeviceDetection';
import { editing } from '../../utils';
import { editorRef } from '../../utils/Refs';
import useIsFloatingKeyboard from '../../utils/use-is-floating-keyboard';
import EditorOverlay from './EditorOverlay';
import { checkStatus, textInput } from './Functions';

export const EditorWrapper = ({ width }) => {
  const [state] = useTracked();
  const { colors } = state;
  const deviceMode = useSettingStore(state => state.deviceMode);
  const loading = useNoteStore(state => state.loading);
  const insets = useSafeAreaInsets();
  const floating = useIsFloatingKeyboard();

  const onAppStateChanged = async state => {
    if (state === 'active') {
      if (!editing.movedAway) {
        await checkStatus(false);
      }
    }
  };

  useEffect(() => {
    if (loading) return;
    let sub = AppState.addEventListener('change', onAppStateChanged);
    return () => {
      sub?.remove();
    };
  }, [loading]);

  return (
    <View
      ref={editorRef}
      style={{
        width: width[deviceMode].c,
        height: '100%',
        backgroundColor: state.colors.bg,
        borderLeftWidth: DDS.isTab ? 1 : 0,
        borderLeftColor: DDS.isTab ? colors.nav : 'transparent'
      }}
    >
      <SafeAreaView
        style={{
          width: '100%',
          height: '100%'
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            width: '100%',
            height: '100%'
          }}
          enabled={!floating}
        >
          <PremiumToast key="toast" context="editor" offset={50 + insets.top} />
          <TextInput
            key="input"
            ref={textInput}
            style={{ height: 1, padding: 0, width: 1, position: 'absolute' }}
            blurOnSubmit={false}
          />
          {loading ? null : <Editor key="editor" />}
          <EditorOverlay key="overlay" />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};
