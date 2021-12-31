import React from 'react';
import {TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Editor from '.';
import {PremiumToast} from '../../components/Premium/premium-toast';
import {useTracked} from '../../provider';
import {useNoteStore, useSettingStore} from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
import {editorRef} from '../../utils/Refs';
import EditorOverlay from './EditorOverlay';
import {textInput} from './Functions';

export const EditorWrapper = ({width, dimensions}) => {
  const [state] = useTracked();
  const {colors} = state;
  const deviceMode = useSettingStore(state => state.deviceMode);
  const loading = useNoteStore(state => state.loading);
  const insets = useSafeAreaInsets();

  return (
    <View
      ref={editorRef}
      style={{
        width: width[deviceMode].c,
        height: '100%',
        backgroundColor: state.colors.bg,
        borderLeftWidth: 1,
        borderLeftColor: DDS.isTab ? colors.nav : 'transparent',
        paddingTop:insets.top,
        paddingBottom:insets.bottom
      }}>
      <PremiumToast key="toast" context="editor" offset={50 + insets.top} />
      <TextInput
        key="input"
        ref={textInput}
        style={{height: 1, padding: 0, width: 1, position: 'absolute'}}
        blurOnSubmit={false}
      />
      {loading ? null : <Editor key="editor" />}
      <EditorOverlay  key="overlay" />
    </View>
  );
};
