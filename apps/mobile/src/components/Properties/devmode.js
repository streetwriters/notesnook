import Clipboard from '@react-native-clipboard/clipboard';
import React from 'react';
import { View } from 'react-native';
import { useSettingStore } from '../../provider/stores';
import { ToastEvent } from '../../services/EventManager';
import { db } from '../../utils/database';
import { SIZE } from '../../utils/SizeUtils';
import { Button } from '../Button';

export const DevMode = ({item}) => {
  const settings = useSettingStore(state => state.settings);

  return settings.devMode ? (
    <View
      style={{
        width: '100%',
        paddingHorizontal: 12,
        marginTop: 10
      }}>
      <Button
        onPress={async () => {
          let additionalData = {};
          if (item.type === 'note') {
            let content = await db.content.raw(item.contentId);
            if (content) {
              content = db.debug.strip(content);
              additionalData.content = content;
            }
          }
          additionalData.lastSynced = await db.lastSynced();
          let _note = {...item};
          _note.additionalData = additionalData;
          Clipboard.setString(db.debug.strip(_note));

          ToastEvent.show({
            heading: 'Debug data copied!',
            type: 'success',
            context: 'local'
          });
        }}
        fontSize={SIZE.sm}
        title="Copy debug data"
        icon="clipboard"
        height={30}
        type="warn"
        style={{
          alignSelf: 'flex-end'
        }}
      />
    </View>
  ) : null;
};
