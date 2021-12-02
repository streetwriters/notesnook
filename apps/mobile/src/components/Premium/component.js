import React, {useState} from 'react';
import {Image, ScrollView, View} from 'react-native';
import {LAUNCH_ROCKET} from '../../assets/images/assets';
import {useTracked} from '../../provider';
import {useUserStore} from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent, presentSheet} from '../../services/EventManager';
import {getElevation} from '../../utils';
import {eOpenLoginDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {ActionIcon} from '../ActionIcon';
import {Button} from '../Button';
import GeneralSheet from '../GeneralSheet';
import {SvgToPngView} from '../ListPlaceholders';
import Seperator from '../Seperator';
import {Toast} from '../Toast';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {features} from './features';
import {Group} from './group';
import {PricingPlans} from './pricing-plans';

export const Component = ({close, promo, getRef}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const user = useUserStore(state => state.user);
  const [floatingButton, setFloatingButton] = useState(false);

  const onPress = async () => {
    if (user) {
      presentSheet({
        context: 'pricing_plans',
        component: <PricingPlans marginTop={1} promo={promo} />,
        noIcon: true,
        noProgress: true
      });
    } else {
      close();
      setTimeout(() => {
        eSendEvent(eOpenLoginDialog, 1);
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
      }}>
      <GeneralSheet context="pricing_plans" />
      <ActionIcon
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
        onScroll={onScroll}>
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            height: 400,
            justifyContent: 'center'
          }}>
          <SvgToPngView
            width={350}
            height={350}
            src={LAUNCH_ROCKET(colors.accent)}
          />
        </View>

        <Heading
          size={SIZE.lg}
          style={{
            alignSelf: 'center',
            paddingTop: 20
          }}>
          Notesnook{' '}
          <Heading size={SIZE.lg} color={colors.accent}>
            Pro
          </Heading>
        </Heading>
        <Paragraph
          size={SIZE.md}
          style={{
            paddingHorizontal: 12,
            textAlign: 'center',
            alignSelf: 'center',
            paddingBottom: 20,
            width: '90%'
          }}>
          Ready to take the next step on your private note taking journey?
        </Paragraph>

        <Button
          onPress={onPress}
          title={
            promo ? promo.text : user ? `See all plans` : 'Try free for 14 days'
          }
          type="accent"
          style={{
            paddingHorizontal: 24,
            marginBottom: 10
          }}
        />

        <Seperator />

        {features.map((item, index) => (
          <Group item={item} index={index} />
        ))}

        <View
          style={{
            paddingHorizontal: 12
          }}>
          <PricingPlans promo={promo} />
        </View>
      </ScrollView>

      {floatingButton ? (
        <Button
          onPress={onPress}
          title={
            promo ? promo.text : user ? `See all plans` : 'Try free for 14 days'
          }
          type="accent"
          style={{
            paddingHorizontal: 24,
            position: 'absolute',
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
