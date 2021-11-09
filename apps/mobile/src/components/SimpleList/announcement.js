import React from 'react';
import {View} from 'react-native';
import {useTracked} from '../../provider';
import {
  allowedPlatforms,
  useMessageStore,
  useSelectionStore
} from '../../provider/stores';
import {eSendEvent, presentSheet} from '../../services/EventManager';
import {hexToRGBA, RGB_Linear_Shade} from '../../utils/ColorUtils';
import {eOpenPremiumDialog, eOpenProgressDialog} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {SIZE} from '../../utils/SizeUtils';
import {SettingsBackupAndRestore} from '../../views/Settings';
import {Button} from '../Button';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

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
        width: '100%'
      }}>
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 12,
          width: '100%'
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}>
            <View
              style={{
                backgroundColor: colors.accent,
                borderRadius: 100,
                width: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 2.5
              }}>
              <Paragraph color={colors.light} size={SIZE.xs}>
                {announcements.length}
              </Paragraph>
            </View>
            <Button
              title={'Announcement'}
              fontSize={12}
              height={null}
              icon="bullhorn"
              style={{
                backgroundColor: color
                  ? RGB_Linear_Shade(
                      colors.night ? 0.04 : -0.04,
                      hexToRGBA(color, 0.12)
                    )
                  : colors.shade
              }}
              buttonType={{text: color || colors.accent}}
              style={{
                paddingVertical: 4
              }}
            />
          </View>

          <Button
            title="Dismiss"
            fontSize={12}
            type="error"
            height={null}
            onPress={() => {
              remove(announcement.id);
            }}
            style={{
              paddingVertical: 4
            }}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          {announcement?.title && (
            <Heading
              style={{
                width: '100%'
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
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}>
          {announcement?.callToActions &&
            announcement.callToActions.map((item, index) =>
              item.platforms.some(
                platform => allowedPlatforms.indexOf(platform) > -1
              ) ? (
                <>
                  <Button
                    key={item.title}
                    title={item.title}
                    fontSize={SIZE.md}
                    buttonType={{
                      color:
                        index === 0
                          ? color
                            ? color
                            : colors.accent
                          : color
                          ? RGB_Linear_Shade(
                              colors.night ? 0.04 : -0.04,
                              hexToRGBA(color, 0.12)
                            )
                          : colors.shade,
                      text:
                        index !== 0
                          ? color
                            ? color
                            : colors.accent
                          : colors.light,
                      selected: color
                        ? color
                        : index === 0
                        ? colors.accent
                        : colors.shade,
                      opacity: 1
                    }}
                    onPress={async () => {
                      if (item.type === 'link') {
                        try {
                          await openLinkInBrowser(item.data, state.colors);
                        } catch (e) {}
                      } else if (item.type === 'promo') {
                        eSendEvent(eOpenPremiumDialog, {
                          promoCode: item.data,
                          text: item.title
                        });
                      } else if (item.type === 'backup') {
                        presentSheet({
                          title: 'Backup & restore',
                          paragraph:
                            'Please enable automatic backups to keep your data safe',
                          noProgress: true,
                          noIcon: true,
                          component: <SettingsBackupAndRestore isSheet={true} />
                        });
                      }
                    }}
                    width={'100%'}
                    style={{
                      marginBottom: 10
                    }}
                  />
                </>
              ) : null
            )}
        </View>
      </View>
    </View>
  );
};
