import React from 'react';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemeStore } from '../../stores/use-theme-store';
import { useUserStore } from '../../stores/use-user-store';
import { openLinkInBrowser } from '../../utils/functions';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import { Button } from '../ui/button';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';

export const Synced = ({ item, close }) => {
  const colors = useThemeStore(state => state.colors);
  const user = useUserStore(state => state.user);
  const lastSynced = useUserStore(state => state.lastSynced);

  return user && lastSynced >= item.dateModified ? (
    <View
      style={{
        paddingVertical: 0,
        width: '100%',
        paddingHorizontal: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignSelf: 'center',
        paddingTop: 10,
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.nav
      }}
    >
      <Icon name="shield-key-outline" color={colors.accent} size={SIZE.xxxl} />

      <View
        style={{
          flex: 1,
          marginLeft: 5,
          flexShrink: 1
        }}
      >
        <Heading
          color={colors.heading}
          size={SIZE.xs}
          style={{
            flexWrap: 'wrap'
          }}
        >
          Encrypted and synced
        </Heading>
        <Paragraph
          style={{
            flexWrap: 'wrap'
          }}
          size={SIZE.xs}
          color={colors.pri}
        >
          No one can view this {item.itemType || item.type} except you.
        </Paragraph>
      </View>

      <Button
        onPress={async () => {
          try {
            close();
            await sleep(300);
            await openLinkInBrowser('https://docs.notesnook.com/how-is-my-data-encrypted/', colors);
          } catch (e) {}
        }}
        fontSize={SIZE.xs + 1}
        title="Learn more"
        height={30}
        type="transparent"
      />
    </View>
  ) : null;
};
