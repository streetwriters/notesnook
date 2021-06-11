import React from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {useMessageStore, useSelectionStore} from '../../provider/stores';
import {eSendEvent} from '../../services/EventManager';
import {eOpenPremiumDialog} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

export const Announcement = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const announcements = useMessageStore(state => state.announcements);
  const remove = useMessageStore(state => state.remove);
  let announcement = announcements.length > 0 ? announcements[0] : null;

  const selectionMode = useSelectionStore(state => state.selectionMode);

  return announcement || selectionMode ? null : (
    <View
      style={{
        backgroundColor: colors.bg,
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
          <Button
            title="Announcement"
            fontSize={12}
            type="shade"
            height={null}
            icon="bullhorn"
            style={{
              paddingVertical: 4,
            }}
          />

          <Button
            title="Dismiss"
            fontSize={12}
            type="error"
            height={null}
            onPress={remove}
            style={{
              paddingVertical: 4,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          {announcement?.title && (
            <Heading
              style={{
                width: '100%',
              }}
              size={SIZE.lg}
              color={colors.heading}>
              {announcement.title}
            </Heading>
          )}
        </View>

        {announcement?.description && (
          <Paragraph color={colors.pri}>{announcement.description}</Paragraph>
        )}
        <Seperator />

        {announcement?.cta && (
          <Button
            type="accent"
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
