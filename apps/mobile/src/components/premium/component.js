import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { LAUNCH_ROCKET } from '../../assets/images/assets';
import { useTracked } from '../../provider';
import { useUserStore } from '../../provider/stores';
import { DDS } from '../../services/DeviceDetection';
import { eSendEvent, presentSheet } from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import { getElevation } from '../../utils';
import { db } from '../../utils/database';
import {
  eClosePremiumDialog,
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenResultDialog
} from '../../utils/events';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import umami from '../../utils/analytics';
import { IconButton } from '../ui/icon-button';
import { AuthMode } from '../auth';
import { Button } from '../ui/button';
import SheetProvider from '../sheet-provider';
import { SvgView } from '../ui/svg';
import Seperator from '../ui/seperator';
import { Toast } from '../toast';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';
import { Walkthrough } from '../walkthroughs';
import { features } from './features';
import { Group } from './group';
import { PricingPlans } from './pricing-plans';

export const Component = ({ close, promo, getRef }) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const user = useUserStore(state => state.user);
  const userCanRequestTrial =
    user && (!user.subscription || !user.subscription.expiry) ? true : false;
  const [floatingButton, setFloatingButton] = useState(false);

  const onPress = async () => {
    if (user) {
      umami.pageView('/pro-plans', `/pro-screen`);
      presentSheet({
        context: 'pricing_plans',
        component: <PricingPlans showTrialOption={false} marginTop={1} promo={promo} />
      });
    } else {
      close();
      umami.pageView('/signup', `/pro-screen`);
      setTimeout(() => {
        eSendEvent(eOpenLoginDialog, AuthMode.trialSignup);
      }, 400);
    }
  };

  const onScroll = event => {
    let contentSize = event.nativeEvent.contentSize.height;
    contentSize = contentSize - event.nativeEvent.layoutMeasurement.height;
    let yOffset = event.nativeEvent.contentOffset.y;

    if (yOffset > 600 && yOffset < contentSize - 400) {
      setFloatingButton(true);
    } else {
      setFloatingButton(false);
    }
  };

  return (
    <View
      style={{
        width: '100%',
        backgroundColor: colors.bg,
        justifyContent: 'space-between',
        borderRadius: 10,
        maxHeight: '100%'
      }}
    >
      <SheetProvider context="pricing_plans" />
      <IconButton
        onPress={() => {
          close();
        }}
        customStyle={{
          position: 'absolute',
          right: DDS.isTab ? 30 : 15,
          top: 30,
          zIndex: 10,
          width: 50,
          height: 50
        }}
        color={colors.pri}
        name="close"
      />

      <ScrollView
        style={{
          paddingHorizontal: DDS.isTab ? DDS.width / 5 : 0
        }}
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
        onScroll={onScroll}
      >
        <View
          key="top-banner"
          style={{
            width: '100%',
            alignItems: 'center',
            height: 400,
            justifyContent: 'center'
          }}
        >
          <SvgView width={350} height={350} src={LAUNCH_ROCKET(colors.accent)} />
        </View>

        <Heading
          key="heading"
          size={SIZE.lg}
          style={{
            alignSelf: 'center',
            paddingTop: 20
          }}
        >
          Notesnook{' '}
          <Heading size={SIZE.lg} color={colors.accent}>
            Pro
          </Heading>
        </Heading>

        <Paragraph
          style={{
            alignSelf: 'center',
            marginBottom: 20
          }}
          size={SIZE.md}
        >
          ({PremiumService.getMontlySub().localizedPrice} / mo)
        </Paragraph>
        <Paragraph
          key="description"
          size={SIZE.md}
          style={{
            paddingHorizontal: 12,
            textAlign: 'center',
            alignSelf: 'center',
            paddingBottom: 20,
            width: '90%'
          }}
        >
          Ready to take the next step on your private note taking journey?
        </Paragraph>

        {userCanRequestTrial ? (
          <Button
            key="calltoaction"
            onPress={async () => {
              try {
                await db.user.activateTrial();
                eSendEvent(eClosePremiumDialog);
                eSendEvent(eCloseProgressDialog);
                await sleep(300);
                Walkthrough.present('trialstarted', false, true);
              } catch (e) {}
            }}
            title="Try free for 14 days"
            type="accent"
            width={250}
            style={{
              paddingHorizontal: 12,
              marginBottom: 15,
              borderRadius: 100
            }}
          />
        ) : null}

        <Button
          key="calltoaction"
          onPress={onPress}
          title={promo ? promo.text : user ? `See all plans` : `Sign up for free`}
          type={userCanRequestTrial ? 'grayAccent' : 'accent'}
          width={250}
          style={{
            paddingHorizontal: 12,
            marginBottom: 15,
            borderRadius: 100
          }}
        />

        {!user || userCanRequestTrial ? (
          <Paragraph
            color={colors.icon}
            size={SIZE.xs}
            style={{
              alignSelf: 'center',
              textAlign: 'center',
              marginTop: 10,
              maxWidth: '80%'
            }}
          >
            {user
              ? `On clicking "Try free for 14 days", your free trial will be activated.`
              : `After sign up you will be asked to activate your free trial.`}{' '}
            <Paragraph size={SIZE.xs} style={{ fontWeight: 'bold' }}>
              No credit card is required.
            </Paragraph>
          </Paragraph>
        ) : null}

        <Seperator key="seperator_1" />

        {features.map((item, index) => (
          <Group key={item.title} item={item} index={index} />
        ))}

        <View
          key="plans"
          style={{
            paddingHorizontal: 12
          }}
        >
          <PricingPlans showTrialOption={false} promo={promo} />
        </View>
      </ScrollView>

      {floatingButton ? (
        <Button
          onPress={onPress}
          title={promo ? promo.text : user ? `See all plans` : 'Sign up for free'}
          type="accent"
          style={{
            paddingHorizontal: 24,
            position: 'absolute',
            borderRadius: 100,
            bottom: 30,
            ...getElevation(10)
          }}
        />
      ) : null}

      <Toast context="local" />
      <View
        style={{
          paddingBottom: 10
        }}
      />
    </View>
  );
};
