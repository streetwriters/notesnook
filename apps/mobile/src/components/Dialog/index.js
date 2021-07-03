import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { DDS } from '../../services/DeviceDetection';
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import { getElevation } from '../../utils';
import { eCloseSimpleDialog, eOpenSimpleDialog } from '../../utils/Events';
import { ph, pv } from '../../utils/SizeUtils';
import Seperator from '../Seperator';
import BaseDialog from './base-dialog';
import DialogButtons from './dialog-buttons';
import DialogHeader from './dialog-header';

export const Dialog = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const [dialogInfo, setDialogInfo] = useState({
    title: '',
    paragraph: '',
    positiveText: 'Done',
    negativeText: 'Cancel',
    positivePress: () => {},
    onClose: () => {},
    negativeText: hide,
    positiveType: 'transparent',
    icon: null,
    paragraphColor:colors.pri
  });

  const show = data => {
    setDialogInfo({...dialogInfo, ...data});
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
  };

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
      await dialogInfo.positivePress();
    }
    hide();
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
    paddingHorizontal: ph,
    paddingVertical: pv,
  };
  
  return (
    visible && (
      <BaseDialog visible={true} onRequestClose={hide}>
        <View style={style}>
          <DialogHeader
            title={dialogInfo.title}
            icon={dialogInfo.icon}
            paragraph={dialogInfo.paragraph}
            paragraphColor={dialogInfo.paragraphColor}
          />
          <Seperator />

          <DialogButtons
            onPressNegative={onNegativePress}
            onPressPositive={onPressPositive}
            positiveTitle={dialogInfo.positiveText}
            negativeTitle={dialogInfo.negativeText}
            positiveType={dialogInfo.positiveType}
          />
        </View>
      </BaseDialog>
    )
  );
};
