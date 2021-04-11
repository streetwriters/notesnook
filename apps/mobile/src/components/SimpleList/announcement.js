import React, {useEffect} from 'react';
import {View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTracked} from '../../provider';
import {eSendEvent} from '../../services/EventManager';
import {eOpenPremiumDialog} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {SIZE} from '../../utils/SizeUtils';
import useAnnouncement from '../../utils/useAnnouncement';
import {Button} from '../Button';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const Announcement = ({data, color}) => {
  const [state] = useTracked();
  const {selectionMode} = state;
  const [announcement, remove] = useAnnouncement();

  return !announcement || selectionMode ? null : (
    <View
      style={{
        backgroundColor: color,
        width: '100%',
      }}>
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 12,
          width: '100%',
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {announcement?.title && (
            <Heading
              style={{
                width: '90%',
              }}
              size={SIZE.lg}
              color="white">
              {announcement.title}
            </Heading>
          )}

          <Icon onPress={remove} name="close" size={SIZE.xl} color="white" />
        </View>

        {announcement?.description && (
          <Paragraph color="white">{announcement.description}</Paragraph>
        )}
        <Seperator />

        {announcement?.cta && (
          <Button
            type="inverted"
            title={announcement.cta.text}
            fontSize={SIZE.md}
            onPress={async () => {
              if (announcement.cta.type === 'link') {
                try {
                  await openLinkInBrowser(
                    announcement.cta.action,
                    state.colors,
                  );
                } catch (e) {}
              } else if (announcement.cta.type === 'promo') {
                eSendEvent(eOpenPremiumDialog, {
                  promoCode: announcement.cta.action,
                  text: announcement.cta.text,
                });
              }
            }}
            width="100%"
          />
        )}
      </View>
    </View>
  );
};
