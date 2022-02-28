import React from 'react';
import { FlatList, View } from 'react-native';
import { useThemeStore } from '../../stores/theme';
import { useMessageStore, useSelectionStore } from '../../stores/stores';
import { Button } from '../ui/button';
import { allowedOnPlatform, renderItem } from './functions';

export const Announcement = ({ color }) => {
  const colors = useThemeStore(state => state.colors);
  const announcements = useMessageStore(state => state.announcements);
  const remove = useMessageStore(state => state.remove);
  let announcement = announcements.length > 0 ? announcements[0] : null;
  const selectionMode = useSelectionStore(state => state.selectionMode);

  return !announcement || selectionMode ? null : (
    <View
      style={{
        backgroundColor: colors.bg,
        width: '100%'
      }}
    >
      <View
        style={{
          paddingVertical: 12,
          width: '100%',
          borderRadius: 10,
          overflow: 'hidden'
        }}
      >
        <Button
          type="errorShade"
          icon="close"
          height={null}
          onPress={() => {
            remove(announcement.id);
          }}
          iconSize={22}
          style={{
            borderRadius: 100,
            paddingHorizontal: 0,
            position: 'absolute',
            top: 10,
            right: 10
          }}
        />
        <View>
          <FlatList
            style={{
              width: '100%',
              marginTop: 15
            }}
            data={announcement?.body.filter(item => allowedOnPlatform(item.platforms))}
            renderItem={({ item, index }) =>
              renderItem({ item: item, index: index, color: colors[color], inline: true })
            }
          />
        </View>
      </View>
    </View>
  );
};
