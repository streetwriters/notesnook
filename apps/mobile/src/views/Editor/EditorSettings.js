import React, {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import ActionSheetWrapper from '../../components/ActionSheetComponent/ActionSheetWrapper';
import BaseDialog from '../../components/Dialog/base-dialog';
import DialogButtons from '../../components/Dialog/dialog-buttons';
import DialogContainer from '../../components/Dialog/dialog-container';
import DialogHeader from '../../components/Dialog/dialog-header';
import Input from '../../components/Input';
import {PressableButton} from '../../components/PressableButton';
import Heading from '../../components/Typography/Heading';
import Paragraph from '../../components/Typography/Paragraph';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/EventManager';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Seperator from '../../components/Seperator';
import SettingsService from '../../services/SettingsService';

export const EditorSettings = () => {
  const [state,dispatch] = useTracked();
  const {colors, settings} = state;
  
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
      name: 'Poems',
      size: '12pt',
      fontname: {name: 'Times New Roman', value: 'times new roman'},
      line_break: 'paragraph',
      direction: 'ltr',
      forecolor: '#ff0000',
      hilitecolor: '#00ff00',
    },
  ];

  const SettingsButton = ({title, description, enabled, id}) => (
    <PressableButton
      onPress={() => {
        let editorSettings = settings.editorSettings;
        if (!editorSettings) {
          editorSettings = {};
        }
        editorSettings[id] = !enabled;
        SettingsService.set('editorSettings', {...editorSettings});
        
      }}
      customStyle={{
        flexDirection: 'row',
        width: '100%',
        height: 40,
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <View
        style={{
          width: '90%',
        }}>
        <Paragraph size={SIZE.md}>{title}</Paragraph>
        <Paragraph color={colors.icon} size={SIZE.sm}>
          {description}
        </Paragraph>
      </View>
      <Icon
        color={enabled ? colors.accent : colors.icon}
        size={SIZE.lg}
        name={
          !enabled ? 'checkbox-blank-circle-outline' : 'check-circle-outline'
        }
      />
    </PressableButton>
  );

  let settingsItems = [
    {
      title: 'Disable gestures',
      description:
        'Disable swipe left to exit editor & swipe down with two fingers to start new note.',
      id: 'disableGestures',
    },
  ];

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
            <BaseDialog
              onRequestClose={() => {
                setSavePreset(false);
              }}
              visible={true}>
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
              onPress: () => {
                setSavePreset(true);
              },
            }}
          />
          <Seperator />
          {settingsItems.map(item => (
            <SettingsButton
              title={item.title}
              description={item.description}
              enabled={
                settings?.editorSettings && settings?.editorSettings[item.id]
              }
              id={item.id}
            />
          ))}
        </View>
      </ActionSheetWrapper>
    )
  );
};
