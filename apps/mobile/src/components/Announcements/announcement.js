import React from 'react';
import {FlatList, View} from 'react-native';
import {useTracked} from '../../provider';
import {useMessageStore, useSelectionStore} from '../../provider/stores';
import {Button} from '../Button';
import {allowedOnPlatform, renderItem} from './functions';

export const Announcement = ({color}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const announcements = useMessageStore(state => state.announcements);
  const remove = useMessageStore(state => state.remove);
  let announcement = announcements.length > 0 ? announcements[0] : null;
  const selectionMode = useSelectionStore(state => state.selectionMode);

  return !announcement || selectionMode ? null : (
    <View
      style={{
        backgroundColor: colors.bg,
        width: '100%',
        paddingHorizontal: 12
      }}>
      <View
        style={{
          paddingVertical: 12,
          width: '100%',
          borderRadius: 10,
          overflow: 'hidden'
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <View />
          <Button
            fontSize={12}
            type="errorShade"
            icon="close"
            height={null}
            onPress={() => {
              remove(announcement.id);
            }}
            iconSize={20}
            style={{
              borderRadius: 100,
              paddingHorizontal: 0,
              backgroundColor: 'transparent'
            }}
          />
        </View>

        <View>
          <FlatList
            style={{
              width: '100%'
            }}
            data={announcement?.body.filter(item =>
              allowedOnPlatform(item.platform)
            )}
            renderItem={({item, index}) =>
              renderItem({item: item, index: index, color: colors[color]})
            }
          />
        </View>
      </View>
    </View>
  );
};
