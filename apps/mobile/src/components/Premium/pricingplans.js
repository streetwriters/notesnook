import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Platform, View} from 'react-native';
import * as RNIap from 'react-native-iap';
import {useTracked} from '../../provider';
import {useUserStore} from '../../provider/stores';
import {
  eSendEvent,
  presentSheet,
  ToastEvent
} from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import {db} from '../../utils/database';
import {
  eClosePremiumDialog,
  eCloseProgressDialog,
  eOpenLoginDialog
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import {Dialog} from '../Dialog';
import BaseDialog from '../Dialog/base-dialog';
import {presentDialog} from '../Dialog/functions';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {PricingItem} from './pricing-item';

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
  compact = false
}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const user = useUserStore(state => state.user);
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState(null);
  const [buying, setBuying] = useState(false);

  const getSkus = async () => {
    try {
      let products = PremiumService.getProducts();

      if (products.length > 0) {
        let offers = {
          monthly: products.find(
            p => p.productId === 'com.streetwriters.notesnook.sub.mo'
          ),
          yearly: products.find(
            p => p.productId === 'com.streetwriters.notesnook.sub.yr'
          )
        };
        setOffers(offers);
        if (promo?.promoCode) {
          getPromo(promo?.promoCode);
        }
        setProducts(products);
      }
    } catch (e) {
      console.log('error getting sku', e);
    }
  };

  const getPromo = productId => {
    let product = products.find(p => p.productId === productId);
    let isMonthly = product.productId.indexOf('.mo') > -1;
    let cycleText = isMonthly
      ? promoCyclesMonthly[
          product.introductoryPriceCyclesAndroid ||
            product.introductoryPriceNumberOfPeriodsIOS
        ]
      : promoCyclesYearly[
          product.introductoryPriceCyclesAndroid ||
            product.introductoryPriceNumberOfPeriodsIOS
        ];

    setProduct({
      type: 'promo',
      offerType: isMonthly ? 'monthly' : 'yearly',
      data: product,
      cycleText: cycleText,
      info: 'Pay monthly, cancel anytime'
    });
  };

  useEffect(() => {
    getSkus();
  }, []);

  const buySubscription = async product => {
    if (buying) return;
    setBuying(true);
    try {
      await RNIap.requestSubscription(
        product?.productId,
        false,
        null,
        null,
        null,
        user.id
      );
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
        actionText: 'Continue',
        noProgress: true
      });
    } catch (e) {
      setBuying(false);
      console.log(e);
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: 12
      }}>
      {
        buying ?  <BaseDialog statusBarTranslucent centered>
        <ActivityIndicator size={80}  color="white"/>
      </BaseDialog>  : null
      } 
      {product?.type === 'promo' ? (
        <Heading
          style={{
            paddingVertical: 15,
            alignSelf: 'center',
            textAlign: 'center'
          }}
          size={SIZE.lg - 4}>
          {product.data.introductoryPrice}
          <Paragraph
            style={{
              textDecorationLine: 'line-through',
              color: colors.icon
            }}
            size={SIZE.sm}>
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
              }}>
              Choose a plan
            </Heading>
          ) : null}

          <View
            style={{
              flexDirection: !compact ? 'column' : 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-around'
            }}>
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
                  try {
                    let productId = await db.offers.getCode(value, Platform.OS);
                    if (productId) {
                      getPromo(productId);
                      ToastEvent.show({
                        heading: 'Discount applied!',
                        type: 'success',
                        context: 'local'
                      });
                    } else {
                      ToastEvent.show({
                        heading: 'Promo code invalid or expired',
                        type: 'error',
                        context: 'local'
                      });
                    }
                  } catch (e) {
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
        </>
      ) : (
        <View>
          {!user ? (
            <Button
              onPress={() => {
                eSendEvent(eClosePremiumDialog);
                setTimeout(() => {
                  eSendEvent(eOpenLoginDialog, 1);
                }, 400);
              }}
              title={'Try free for 14 days'}
              type="accent"
              style={{
                paddingHorizontal: 24,
                marginTop: 20,
                marginBottom: 10
              }}
            />
          ) : (
            <>
              <PricingItem
                product={product}
                onPress={() => buySubscription(product.data)}
              />
              <Button
                onPress={() => {
                  setProduct(null);
                }}
                height={30}
                type="errorShade"
                title="Cancel promo code"
              />
            </>
          )}
        </View>
      )}

      {!user ? (
        <Paragraph
          color={colors.icon}
          size={SIZE.xs + 1}
          style={{
            alignSelf: 'center',
            textAlign: 'center',
            marginTop: 10
          }}>
          Upon signing up, your 14 day free trial of Notesnook Pro will be
          activated automatically.{' '}
          <Paragraph size={SIZE.xs + 1} style={{fontWeight: 'bold'}}>
            No credit card information is required.
          </Paragraph>{' '}
          Once the free trial period ends, your account will be downgraded to
          basic free account.{' '}
          <Paragraph
            size={SIZE.xs + 1}
            onPress={() => {
              openLinkInBrowser('https://notesnook.com/#pricing', colors)
                .catch(e => {})
                .then(r => {
                  console.log('closed');
                });
            }}
            color={colors.accent}
            style={{fontWeight: 'bold', textDecorationLine: 'underline'}}>
            Visit our website to learn what is included in the basic free
            account.
          </Paragraph>
        </Paragraph>
      ) : null}

      {user ? (
        <>
          {Platform.OS === 'ios' ? (
            <Paragraph
              textBreakStrategy="balanced"
              size={SIZE.xs + 1}
              color={colors.icon}
              style={{
                alignSelf: 'center',
                marginTop: 10,
                textAlign: 'center'
              }}>
              By subscribing, you will be charged to your iTunes Account for the
              selected plan. Subscriptions will automatically renew unless
              cancelled within 24-hours before the end of the current period.
            </Paragraph>
          ) : (
            <Paragraph
              size={SIZE.xs + 1}
              color={colors.icon}
              style={{
                alignSelf: 'center',
                marginTop: 10,
                textAlign: 'center'
              }}>
              By subscribing, your will be charged on your Google Account, and
              your subscription will automatically renew until you cancel prior
              to the end of the then current period.
            </Paragraph>
          )}

          <View
            style={{
              width: '100%',
            }}>
            <Paragraph
              size={SIZE.xs + 1}
              color={colors.icon}
              style={{
                maxWidth: '100%',
                textAlign: 'center'
              }}>
              By subscribing, you agree to our{' '}
              <Paragraph
                size={SIZE.xs + 1}
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
                color={colors.accent}>
                Terms of Service{' '}
              </Paragraph>
              and{' '}
              <Paragraph
                size={SIZE.xs + 1}
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
                color={colors.accent}>
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
