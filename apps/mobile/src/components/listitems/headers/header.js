import React from 'react';
import { View } from 'react-native';
import { useTracked } from '../../../provider';
import { useMessageStore } from '../../../provider/stores';
import { COLORS_NOTE } from '../../../utils/color-scheme';
import { Announcement } from '../../announcements/announcement';
import { Card } from '../../list/card';

export const Header = React.memo(
  ({ type, messageCard = true, color, shouldShow = false, noAnnouncement }) => {
    const [state] = useTracked();
    const { colors } = state;
    const announcements = useMessageStore(state => state.announcements);

    return (
      <>
        {announcements.length !== 0 && !noAnnouncement ? (
          <Announcement color={color || colors.accent} />
        ) : type === 'search' ? null : !shouldShow ? (
          <View
            style={{
              marginBottom: 5,
              padding: 0,
              width: '100%',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {messageCard ? (
              <Card color={COLORS_NOTE[color?.toLowerCase()] || colors.accent} />
            ) : null}
          </View>
        ) : null}
      </>
    );
  }
);

Header.displayName = 'Header';
