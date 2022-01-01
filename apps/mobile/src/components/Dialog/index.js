import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { getElevation } from '../../utils';
import { eCloseSimpleDialog, eOpenSimpleDialog } from '../../utils/Events';
import { sleep } from '../../utils/TimeUtils';
import Input from '../Input';
import Seperator from '../Seperator';
import { Toast } from '../Toast';
import BaseDialog from './base-dialog';
import DialogButtons from './dialog-buttons';
import DialogHeader from './dialog-header';

export const Dialog = ({context = 'global'}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const [inputValue, setInputValue] = useState(null);
  const inputRef = useRef();
  const [dialogInfo, setDialogInfo] = useState({
    title: '',
    paragraph: '',
    positiveText: 'Done',
    negativeText: 'Cancel',
    positivePress: () => {},
    onClose: () => {},
    positiveType: 'transparent',
    icon: null,
    paragraphColor: colors.pri,
    input: false,
    inputPlaceholder: 'Enter some text',
    defaultValue: '',
    disableBackdropClosing:false
  });

  useEffect(() => {
    eSubscribeEvent(eOpenSimpleDialog, show);
    eSubscribeEvent(eCloseSimpleDialog, hide);

    return () => {
      eUnSubscribeEvent(eOpenSimpleDialog, show);
      eUnSubscribeEvent(eCloseSimpleDialog, hide);
    };
  }, []);

  const onPressPositive = async () => {
    if (dialogInfo.positivePress) {
      inputRef.current?.blur();
      let result = await dialogInfo.positivePress(
        inputValue || dialogInfo.defaultValue
      );
      if (result === false) {
        return;
      }
    }
    hide();
  };

  const show = data => {
    if (data.context && data.context !== context) return;
    setDialogInfo(data);
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
  };

  const onNegativePress = async () => {
    if (dialogInfo.onClose) {
      await dialogInfo.onClose();
    }

    hide();
  };

  const style = {
    ...getElevation(5),
    width: DDS.isTab ? 400 : '85%',
    maxHeight: 450,
    borderRadius: 5,
    backgroundColor: colors.bg,
    paddingTop: 12
  };

  return (
    visible && (
      <BaseDialog
        statusBarTranslucent={false}
        bounce={!dialogInfo.input}
        closeOnTouch={!dialogInfo.disableBackdropClosing}
        onShow={async () => {
          if (dialogInfo.input) {
            
            inputRef.current?.setNativeProps({
              text:dialogInfo.defaultValue
            });
            await sleep(300);
            inputRef.current?.focus();
          }
        }}
        visible={true}
        onRequestClose={hide}>
        <View style={style}>
          <DialogHeader
            title={dialogInfo.title}
            icon={dialogInfo.icon}
            paragraph={dialogInfo.paragraph}
            paragraphColor={dialogInfo.paragraphColor}
            padding={12}
          />
          <Seperator half />

          {dialogInfo.input ? (
            <View
              style={{
                paddingHorizontal: 12
              }}>
              <Input
                fwdRef={inputRef}
                autoCapitalize="none"
                onChangeText={value => {
                  setInputValue(value);
                }}
                secureTextEntry={dialogInfo.secureTextEntry}
                //defaultValue={dialogInfo.defaultValue}
                onSubmit={onPressPositive}
                returnKeyLabel="Done"
                returnKeyType="done"
                placeholder={dialogInfo.inputPlaceholder}
              />
            </View>
          ) : null}

          <DialogButtons
            onPressNegative={onNegativePress}
            onPressPositive={dialogInfo.positivePress && onPressPositive}
            positiveTitle={dialogInfo.positiveText}
            negativeTitle={dialogInfo.negativeText}
            positiveType={dialogInfo.positiveType}
          />
        </View>
        <Toast context="local" />
      </BaseDialog>
    )
  );
};
