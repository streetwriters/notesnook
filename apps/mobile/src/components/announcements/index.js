import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useThemeStore } from '../../stores/theme';
import { useMessageStore } from '../../stores/stores';
import { DDS } from '../../services/device-detection';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import { eCloseAnnouncementDialog, eOpenAnnouncementDialog } from '../../utils/events';
import BaseDialog from '../dialog/base-dialog';
import { allowedOnPlatform, renderItem } from './functions';

export const AnnouncementDialog = () => {
  const colors = useThemeStore(state => state.colors);
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState(null);
  const remove = useMessageStore(state => state.remove);

  useEffect(() => {
    eSubscribeEvent(eOpenAnnouncementDialog, open);
    eSubscribeEvent(eCloseAnnouncementDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenAnnouncementDialog, open);
      eUnSubscribeEvent(eCloseAnnouncementDialog, close);
    };
  }, [visible]);

  const open = data => {
    setInfo(data);
    setVisible(true);
  };

  const close = () => {
    if (visible) {
      remove(info.id);
      setInfo(null);
      setVisible(false);
    }
  };

  return (
    <BaseDialog
      animated={false}
      centered={false}
      bottom={true}
      onRequestClose={close}
      visible={visible}
    >
      <View
        style={{
          width: DDS.isTab ? 600 : '100%',
          backgroundColor: colors.bg,
          maxHeight: DDS.isTab ? '90%' : '100%',
          borderRadius: DDS.isTab ? 10 : 0,
          overflow: 'hidden',
          marginBottom: DDS.isTab ? 20 : 0
        }}
      >
        <FlatList
          style={{
            width: '100%'
          }}
          data={info?.body.filter(item => allowedOnPlatform(item.platforms))}
          renderItem={renderItem}
        />

        <View
          style={{
            height: 15
          }}
        />
      </View>
    </BaseDialog>
  );
};
