import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import * as RNIap from 'react-native-iap';
import { useTracked } from '../../provider';
import { useUserStore } from '../../provider/stores';
import { eSendEvent, presentSheet, ToastEvent } from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import { db } from '../../utils/database';
import {
  eClosePremiumDialog,
  eCloseProgressDialog,
  eCloseSimpleDialog,
  eOpenLoginDialog
} from '../../utils/Events';
import { openLinkInBrowser } from '../../utils/functions';
import { SIZE } from '../../utils/SizeUtils';
import { sleep } from '../../utils/TimeUtils';
import umami from '../../utils/umami';
import { Button } from '../Button';
import { Dialog } from '../Dialog';
import BaseDialog from '../Dialog/base-dialog';
import { presentDialog } from '../Dialog/functions';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import { Walkthrough } from '../Walkthrough';
import { PricingItem } from './pricing-item';

const promoCyclesMonthly = {
  1: 'first month',
  2: 'first 2 months',
  3: 'first 3 months'
};

const promoCyclesYearly = {
  1: 'first year',
  2: 'first 2 years',
  3: 'first 3 years'
};

export const PricingPlans = ({
  promo,
  marginTop,
  heading = true,
  compact = false,
  trial = false,
  showTrialOption = true
}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const user = useUserStore(state => state.user);
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState(null);
  const [buying, setBuying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [upgrade, setUpgrade] = useState(!showTrialOption);

  const getSkus = async () => {
    try {
      setLoading(true);
      let products = await PremiumService.getProducts();
      if (products.length > 0) {
        let offers = {
          monthly: products.find(p => p.productId === 'com.streetwriters.notesnook.sub.mo'),
          yearly: products.find(p => p.productId === 'com.streetwriters.notesnook.sub.yr')
        };
        setOffers(offers);

        if (promo?.promoCode) {
          getPromo(promo?.promoCode);
        }

        setProducts(products);
      }
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.log('error getting sku', e);
    }
  };

  const getPromo = async code => {
    try {
      let productId;
      if (code.startsWith('com.streetwriters.notesnook')) {
        productId = code;
      } else {
        productId = await db.offers.getCode(code.split(':')[0], Platform.OS);
      }

      let products = await PremiumService.getProducts();
      let product = products.find(p => p.productId === productId);
      if (!product) return false;
      let isMonthly = product.productId.indexOf('.mo') > -1;
      let cycleText = isMonthly
        ? promoCyclesMonthly[
            product.introductoryPriceCyclesAndroid || product.introductoryPriceNumberOfPeriodsIOS
          ]
        : promoCyclesYearly[
            product.introductoryPriceCyclesAndroid || product.introductoryPriceNumberOfPeriodsIOS
          ];

      setProduct({
        type: 'promo',
        offerType: isMonthly ? 'monthly' : 'yearly',
        data: product,
        cycleText: cycleText,
        info: 'Pay monthly, cancel anytime'
      });
      return true;
    } catch (e) {
      console.log('PROMOCODE ERROR:', code, e);
      return false;
    }
  };

  useEffect(() => {
    getSkus();
  }, []);

  const buySubscription = async product => {
    if (buying) return;
    setBuying(true);
    try {
      if (!user) {
        setBuying(false);
        return;
      }
      umami.pageView('/iap-native', `${compact ? 'pro-sheet' : 'pro-screen'}/pro-plans`);
      await RNIap.requestSubscription(product?.productId, false, null, null, null, user.id);
      setBuying(false);
      eSendEvent(eCloseProgressDialog);
      eSendEvent(eClosePremiumDialog);
      await sleep(500);
      presentSheet({
        title: 'Thank you for subscribing!',
        paragraph: `Your Notesnook Pro subscription will be activated within a few hours. If your account is not upgraded to Notesnook Pro, your money will be refunded to you. In case of any issues, please reach out to us at support@streetwriters.co`,
        action: async () => {
          eSendEvent(eCloseProgressDialog);
        },
        icon: 'check',
        actionText: 'Continue'
      });
    } catch (e) {
      setBuying(false);
      console.log(e);
    }
  };

  return loading ? (
    <View
      style={{
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        height: 100
      }}
    >
      <ActivityIndicator color={colors.accent} size={25} />
    </View>
  ) : (
    <View
      style={{
        paddingHorizontal: 12
      }}
    >
      {buying ? (
        <BaseDialog statusBarTranslucent centered>
          <ActivityIndicator size={50} color="white" />
        </BaseDialog>
      ) : null}

      {!upgrade ? (
        <>
          <Paragraph
            style={{
              alignSelf: 'center'
            }}
            size={SIZE.lg}
          >
            {PremiumService.getMontlySub().localizedPrice} / mo
          </Paragraph>
          <Button
            onPress={() => {
              setUpgrade(true);
            }}
            title={`Upgrade now`}
            type="accent"
            width={250}
            style={{
              paddingHorizontal: 12,
              marginBottom: 15,
              marginTop: 15,
              borderRadius: 100
            }}
          />

          <Button
            onPress={async () => {
              try {
                await db.user.activateTrial();
                eSendEvent(eClosePremiumDialog);
                eSendEvent(eCloseProgressDialog);
                await sleep(300);
                Walkthrough.present('trialstarted', false, true);
              } catch (e) {}
            }}
            title={`Try free for 14 days`}
            type="grayAccent"
            width={250}
            style={{
              paddingHorizontal: 12,
              marginBottom: 15,
              borderRadius: 100
            }}
          />
        </>
      ) : (
        <>
          {product?.type === 'promo' ? (
            <Heading
              style={{
                paddingVertical: 15,
                alignSelf: 'center',
                textAlign: 'center'
              }}
              size={SIZE.lg - 4}
            >
              {product.data.introductoryPrice}
              <Paragraph
                style={{
                  textDecorationLine: 'line-through',
                  color: colors.icon
                }}
                size={SIZE.sm}
              >
                ({product.data.localizedPrice})
              </Paragraph>{' '}
              for {product.cycleText}
            </Heading>
          ) : null}

          {user && !product ? (
            <>
              {heading ? (
                <Heading
                  style={{
                    alignSelf: 'center',
                    marginTop: marginTop || 20,
                    marginBottom: 20
                  }}
                >
                  Choose a plan
                </Heading>
              ) : null}

              <View
                style={{
                  flexDirection: !compact ? 'column' : 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-around'
                }}
              >
                <PricingItem
                  onPress={() => buySubscription(offers?.monthly)}
                  compact={compact}
                  product={{
                    type: 'monthly',
                    data: offers?.monthly,
                    info: 'Pay monthly, cancel anytime.'
                  }}
                />

                {!compact && (
                  <View
                    style={{
                      height: 1,
                      marginVertical: 5
                    }}
                  />
                )}

                <PricingItem
                  onPress={() => buySubscription(offers?.yearly)}
                  compact={compact}
                  product={{
                    type: 'yearly',
                    data: offers?.yearly,
                    info: 'Pay yearly'
                  }}
                />
              </View>

              {Platform.OS !== 'ios' ? (
                <Button
                  height={35}
                  style={{
                    marginTop: 10
                  }}
                  onPress={() => {
                    presentDialog({
                      context: 'local',
                      input: true,
                      inputPlaceholder: 'Enter code',
                      positiveText: 'Apply',
                      positivePress: async value => {
                        if (!value) return;
                        console.log(value);
                        eSendEvent(eCloseSimpleDialog);
                        setBuying(true);
                        try {
                          if (!(await getPromo(value)))
                            throw new Error('Error applying promo code');
                          ToastEvent.show({
                            heading: 'Discount applied!',
                            type: 'success',
                            context: 'local'
                          });
                          setBuying(false);
                        } catch (e) {
                          setBuying(false);
                          ToastEvent.show({
                            heading: 'Promo code invalid or expired',
                            message: e.message,
                            type: 'error',
                            context: 'local'
                          });
                        }
                      },
                      title: 'Have a promo code?',
                      paragraph: 'Enter your promo code to get a special discount.'
                    });
                  }}
                  title="I have a promo code"
                />
              ) : (
                <View
                  style={{
                    height: 15
                  }}
                />
              )}
            </>
          ) : (
            <View>
              {!user ? (
                <>
                  <Button
                    onPress={() => {
                      eSendEvent(eClosePremiumDialog);
                      eSendEvent(eCloseProgressDialog);
                      setTimeout(() => {
                        eSendEvent(eOpenLoginDialog, 1);
                      }, 400);
                    }}
                    title={`Sign up for free`}
                    type="accent"
                    width={250}
                    style={{
                      paddingHorizontal: 12,
                      marginTop: 30,
                      marginBottom: 10,
                      borderRadius: 100
                    }}
                  />
                  {Platform.OS !== 'ios' &&
                  promo &&
                  !promo.promoCode.startsWith('com.streetwriters.notesnook') ? (
                    <Paragraph
                      size={SIZE.md}
                      textBreakStrategy="balanced"
                      style={{
                        alignSelf: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}
                    >
                      Use promo code{' '}
                      <Text
                        style={{
                          fontFamily: 'OpenSans-SemiBold'
                        }}
                      >
                        {promo.promoCode}
                      </Text>{' '}
                      at checkout
                    </Paragraph>
                  ) : null}
                </>
              ) : (
                <>
                  <Button
                    onPress={() => buySubscription(product.data)}
                    height={40}
                    width="50%"
                    type="accent"
                    title="Subscribe now"
                  />

                  <Button
                    onPress={() => {
                      setProduct(null);
                    }}
                    style={{
                      marginTop: 5
                    }}
                    height={30}
                    fontSize={13}
                    type="errorShade"
                    title="Cancel promo code"
                  />
                </>
              )}
            </View>
          )}
        </>
      )}

      {!user || !upgrade ? (
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

      {user && upgrade ? (
        <>
          {Platform.OS === 'ios' ? (
            <Paragraph
              textBreakStrategy="balanced"
              size={SIZE.xs}
              color={colors.icon}
              style={{
                alignSelf: 'center',
                marginTop: 10,
                textAlign: 'center'
              }}
            >
              By subscribing, you will be charged to your iTunes Account for the selected plan.
              Subscriptions will automatically renew unless cancelled within 24-hours before the end
              of the current period.
            </Paragraph>
          ) : (
            <Paragraph
              size={SIZE.xs}
              color={colors.icon}
              style={{
                alignSelf: 'center',
                marginTop: 10,
                textAlign: 'center'
              }}
            >
              By subscribing, your will be charged on your Google Account, and your subscription
              will automatically renew until you cancel prior to the end of the then current period.
            </Paragraph>
          )}

          <View
            style={{
              width: '100%'
            }}
          >
            <Paragraph
              size={SIZE.xs}
              color={colors.icon}
              style={{
                maxWidth: '100%',
                textAlign: 'center'
              }}
            >
              By subscribing, you agree to our{' '}
              <Paragraph
                size={SIZE.xs}
                onPress={() => {
                  openLinkInBrowser('https://notesnook.com/tos', colors)
                    .catch(e => {})
                    .then(r => {
                      console.log('closed');
                    });
                }}
                style={{
                  textDecorationLine: 'underline'
                }}
                color={colors.accent}
              >
                Terms of Service{' '}
              </Paragraph>
              and{' '}
              <Paragraph
                size={SIZE.xs}
                onPress={() => {
                  openLinkInBrowser('https://notesnook.com/privacy', colors)
                    .catch(e => {})
                    .then(r => {
                      console.log('closed');
                    });
                }}
                style={{
                  textDecorationLine: 'underline'
                }}
                color={colors.accent}
              >
                Privacy Policy.
              </Paragraph>
            </Paragraph>
          </View>
        </>
      ) : null}

      <Dialog context="local" />
    </View>
  );
};
