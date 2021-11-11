import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTracked } from '../../provider';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  presentSheet
} from '../../services/EventManager';
import {
  eOpenPremiumDialog,
  eOpenResultDialog,
  eOpenTrialEndingDialog
} from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import { Button } from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import DialogContainer from '../Dialog/dialog-container';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import { FeatureBlock } from './feature';
import { Offer } from './offer';
import { PricingPlans } from './pricing-plans';

export const Expiring = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState({
    title: '',
    offer: null,
    extend: false
  });

  useEffect(() => {
    eSubscribeEvent(eOpenTrialEndingDialog, open);
    return () => {
      eUnSubscribeEvent(eOpenTrialEndingDialog, open);
    };
  }, []);

  const open = status => {
    setStatus(status);
    setVisible(true);
  };

  return (
    visible && (
      <BaseDialog
        onRequestClose={() => {
          setVisible(false);
        }}>
        <DialogContainer>
          <View
            style={{
              width: '100%',
              alignItems: 'center'
            }}>
            <View
              style={{
                paddingHorizontal: 12,
                width: '100%'
              }}>
              <Heading
                textBreakStrategy="balanced"
                style={{
                  textAlign: 'center',
                  paddingTop: 18
                }}>
                {status.title}
              </Heading>
              <Seperator />
              <View
                style={{
                  width: '100%',
                  alignItems: 'center'
                }}>
                {status.offer ? (
                  <>
                    <Offer padding={20} off={status.offer} />
                  </>
                ) : (
                  <>
                    <Paragraph
                      textBreakStrategy="balanced"
                      style={{
                        textAlign: 'center',
                        paddingTop: 0,
                        paddingBottom: 20
                      }}
                      size={SIZE.md + 2}>
                      Upgrade now to continue using all the pro features after
                      your trial ends
                    </Paragraph>
                  </>
                )}

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{
                    width: '100%'
                  }}>
                  {[
                    {
                      highlight: 'Everything',
                      content: 'in basic',
                      icon: 'emoticon-wink'
                    },
                    {
                      highlight: 'Unlimited',
                      content: 'notebooks',
                      icon: 'notebook'
                    },
                    {
                      highlight: 'File & image',
                      content: 'attachments',
                      icon: 'attachment'
                    },
                    {
                      highlight: 'Instant',
                      content: 'syncing',
                      icon: 'sync'
                    },
                    {
                      highlight: 'Private',
                      content: 'vault',
                      icon: 'shield'
                    },
                    {
                      highlight: 'Rich text',
                      content: 'editing',
                      icon: 'square-edit-outline'
                    },
                    {
                      highlight: 'PDF & markdown',
                      content: 'exports',
                      icon: 'file'
                    },
                    {
                      highlight: 'Encrypted',
                      content: 'backups',
                      icon: 'backup-restore'
                    }
                  ].map(item => (
                    <FeatureBlock {...item} />
                  ))}
                </ScrollView>

                <Paragraph
                  onPress={async () => {
                    setVisible(false);
                    await sleep(300);
                    eSendEvent(eOpenPremiumDialog);
                  }}
                  size={SIZE.xs + 2}
                  style={{
                    textDecorationLine: 'underline',
                    color: colors.icon,
                    marginTop: 10
                  }}>
                  See what's included in Basic & Pro plans
                </Paragraph>

                <Seperator />
              </View>
            </View>

            <View
              style={{
                backgroundColor: colors.nav,
                width: '100%',
                borderBottomRightRadius: 10,
                borderBottomLeftRadius: 10
              }}>
              <Button
                type="transparent"
                title="Subscribe now"
                onPress={async () => {
                  setVisible(false);
                  await sleep(300);
                  presentSheet({
                    component: <PricingPlans marginTop={1} promo={null} />,
                    noIcon: true,
                    noProgress: true
                  });
                }}
                fontSize={SIZE.lg}
                style={{
                  marginBottom: status.extend ? 0 : 12,
                  marginTop: 12,
                  paddingHorizontal: 24
                }}
              />

              {status.extend && (
                <Button
                  type="gray"
                  title="Not sure yet? Extend trial for 7 days"
                  textStyle={{
                    textDecorationLine: 'underline'
                  }}
                  onPress={async () => {
                    setVisible(false);
                    await sleep(300);
                    eSendEvent(eOpenResultDialog, {
                      title: 'Your trial has been extended',
                      paragraph:
                        'Try out all features of Notesnook free for 7 more days. No limitations. No commitments.',
                      button: 'Continue'
                    });
                  }}
                  fontSize={SIZE.sm}
                  height={30}
                  style={{
                    marginBottom: 12
                  }}
                />
              )}
            </View>
          </View>
        </DialogContainer>
      </BaseDialog>
    )
  );
};
