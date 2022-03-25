import React, { useEffect } from 'react';
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TextInput,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Editor from '.';
import { PremiumToast } from '../../components/premium/premium-toast';
import { DDS } from '../../services/device-detection';
import { useNoteStore, useSettingStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { editing } from '../../utils';
import { editorRef } from '../../utils/global-refs';
import useIsFloatingKeyboard from '../../utils/hooks/use-is-floating-keyboard';
import EditorOverlay from './EditorOverlay';
import { checkStatus, textInput } from './Functions';

export const EditorWrapper = ({ width }) => {
  const colors = useThemeStore(state => state.colors);
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
        backgroundColor: colors.bg,
        borderLeftWidth: DDS.isTab ? 1 : 0,
        borderLeftColor: DDS.isTab ? colors.nav : 'transparent'
      }}
    >
      <SafeAreaView
        style={{
          flex: 1
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{
            flex: 1
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
