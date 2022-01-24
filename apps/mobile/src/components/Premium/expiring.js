import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTracked } from '../../provider';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import { eOpenPremiumDialog, eOpenResultDialog, eOpenTrialEndingDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import { Button } from '../Button';
import BaseDialog from '../Dialog/base-dialog';
import DialogContainer from '../Dialog/dialog-container';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import { CompactFeatures } from './compact-features';
import { Offer } from './offer';

export const Expiring = () => {
  const [state, dispatch] = useTracked();
  const { colors } = state;
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState({
    title: 'Your trial is ending soon',
    offer: null,
    extend: true
  });
  const promo = status.offer
    ? {
        promoCode: 'com.streetwriters.notesnook.sub.yr.trialoffer',
        text: 'GET 30% OFF on yearly'
      }
    : null;

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
        }}
      >
        <DialogContainer>
          <View
            style={{
              width: '100%',
              alignItems: 'center'
            }}
          >
            <View
              style={{
                paddingHorizontal: 12,
                width: '100%'
              }}
            >
              <Heading
                textBreakStrategy="balanced"
                style={{
                  textAlign: 'center',
                  paddingTop: 18
                }}
              >
                {status.title}
              </Heading>
              <Seperator />
              <View
                style={{
                  width: '100%',
                  alignItems: 'center'
                }}
              >
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
                      size={SIZE.md + 2}
                    >
                      Upgrade now to continue using all the pro features after your trial ends
                    </Paragraph>
                  </>
                )}

                <CompactFeatures />

                <Paragraph
                  onPress={async () => {
                    setVisible(false);
                    await sleep(300);
                    eSendEvent(eOpenPremiumDialog, promo);
                  }}
                  size={SIZE.xs + 1}
                  style={{
                    textDecorationLine: 'underline',
                    color: colors.icon,
                    marginTop: 10
                  }}
                >
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
              }}
            >
              <Button
                type="transparent"
                title="Subscribe now"
                onPress={async () => {
                  setVisible(false);
                  await sleep(300);
                  PremiumService.sheet(null, promo);
                }}
                fontSize={SIZE.md + 2}
                style={{
                  marginBottom: status.extend ? 0 : 10,
                  marginTop: 10,
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
                  fontSize={SIZE.xs}
                  height={30}
                  style={{
                    marginBottom: 10
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
