import React, {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import ActionSheetWrapper from '../../components/ActionSheetComponent/ActionSheetWrapper';
import BaseDialog from '../../components/Dialog/base-dialog';
import DialogButtons from '../../components/Dialog/dialog-buttons';
import DialogContainer from '../../components/Dialog/dialog-container';
import DialogHeader from '../../components/Dialog/dialog-header';
import Input from '../../components/Input';
import Heading from '../../components/Typography/Heading';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';

export const EditorSettings = () => {
  const [state] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const [savePreset, setSavePreset] = useState(false);
  const actionSheetRef = useRef();

  const open = async () => {
    setVisible(true);
    await sleep(1);
    actionSheetRef.current?.setModalVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  useEffect(() => {
    eSubscribeEvent('openEditorSettings', open);
    eSubscribeEvent('closeEditorSettings', close);
    return () => {
      eUnSubscribeEvent('openEditorSettings', open);
      eUnSubscribeEvent('closeEditorSettings', close);
    };
  }, []);

  let presets = [
    {
      name:"Poems",
      size:"12pt",
      fontname: {name: 'Times New Roman', value: 'times new roman'},
      line_break:"paragraph",
      direction:"ltr",
      forecolor:"#ff0000",
      hilitecolor:"#00ff00",
    }
  ]

  return (
    visible && (
      <ActionSheetWrapper
        fwdRef={actionSheetRef}
        onClose={() => {
          setVisible(false);
        }}>
        <View
          style={{
            paddingHorizontal: 12,
          }}>
          {savePreset && (
            <BaseDialog visible={true}>
              <DialogContainer>
                <DialogHeader
                  title="Save preset"
                  paragraph="Give this preset a name."
                />
                <Input placeholder="Preset name" />
                <DialogButtons
                  positiveTitle="Save"
                  onPressPositive={() => {}}
                  negativeTitle="Cancel"
                />
              </DialogContainer>
            </BaseDialog>
          )}

          <DialogHeader
            title="Editor settings"
            paragraph="Modify editor settings based on personal preference."
            button={{
              title: 'Save as Preset',
              onPress: () => {},
            }}
          />
        </View>
      </ActionSheetWrapper>
    )
  );
};
