import React from 'react';
import { FlatList, View } from 'react-native';
import { useMessageStore, useSelectionStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { allowedOnPlatform, renderItem } from './functions';

export const Announcement = ({ color }) => {
  const colors = useThemeStore(state => state.colors);
  const announcements = useMessageStore(state => state.announcements);
  let announcement = announcements.length > 0 ? announcements[0] : null;
  const selectionMode = useSelectionStore(state => state.selectionMode);

  return !announcement || selectionMode ? null : (
    <View
      style={{
        backgroundColor: colors.bg,
        width: '100%',
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 12
      }}
    >
      <View
        style={{
          width: '100%',
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: colors.nav
        }}
      >
        <View>
          <FlatList
            style={{
              width: '100%',
              marginTop: 12
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
