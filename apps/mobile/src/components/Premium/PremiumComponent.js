import React, {useEffect, useRef, useState} from 'react';
import {Platform, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';
import * as RNIap from 'react-native-iap';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import {db} from '../../utils/database';
import {
  eCloseProgressDialog,
  eOpenLoginDialog,
  eOpenProgressDialog
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {normalize, SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import {Dialog} from '../Dialog';
import {presentDialog} from '../Dialog/functions';
import {Toast} from '../Toast';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useUserStore} from '../../provider/stores';

const features = [
  {
    title: 'Unlimited attachments'
  },
  {
    title: 'Unlimited storage'
  },
  {
    title: 'Unlimited notebooks and tags'
  },
  {
    title: 'Automatic syncing'
  },
  {
    title: 'Secure private vault for notes'
  },
  {
    title: 'Full rich text editor with markdown support'
  },
  {
    title: 'Export notes in PDF, Markdown and HTML'
  },
  {
    title: 'Automatic encrypted backups'
  },
  {
    title: 'Change app theme & accent colors'
  },
  {
    title: 'Special Pro badge on our Discord server'
  }
];

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

export const PremiumComponent = ({close, promo, getRef}) => {
  const [state, dispatch] = useTracked();
  const colors = state.colors;
  const user = useUserStore(state => state.user);
  const [product, setProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [buying, setBuying] = useState(false);
  const scrollViewRef = useRef();
  const [offers, setOffers] = useState(null);

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
          getPromo(promo.promoCode);
        } else {
          setProduct({
            type: 'monthly',
            data: offers.monthly
          });
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
      cycleText: cycleText
    });
  };

  useEffect(() => {
    console.log(product);
  }, [product]);

  useEffect(() => {
    getSkus();
  }, []);

  const buySubscription = async () => {
    if (buying) return;
    if (!user) {
      close();
      setTimeout(() => {
        eSendEvent(eOpenLoginDialog, 1);
      }, 400);
    } else {
      setBuying(true);
      RNIap.requestSubscription(
        product?.data.productId,
        false,
        null,
        null,
        null,
        user.id
      )
        .then(async r => {
          setBuying(false);
          close();
          await sleep(1000);
          eSendEvent(eOpenProgressDialog, {
            title: 'Thank you for subscribing!',
            paragraph: `Your Notesnook Pro subscription will be activated within a few hours. If your account is not upgraded to Notesnook Pro, your money will be refunded to you. In case of any issues, please reach out to us at support@streetwriters.co`,
            action: async () => {
              eSendEvent(eCloseProgressDialog);
            },
            icon: 'check',
            actionText: 'Continue',
            noProgress: true
          });
        })
        .catch(e => {
          setBuying(false);
          console.log(e);
        });
    }
  };

  return (
    <View
      style={{
        width: '100%',
        backgroundColor: colors.bg,
        justifyContent: 'space-between',
        borderRadius: 10,
        maxHeight: DDS.isTab ? '90%' : '100%'
      }}>
      <Dialog context="local" />
      <Heading
        size={SIZE.xxxl}
        style={{
          alignSelf: 'center'
        }}>
        Notesnook{' '}
        <Heading size={SIZE.xxxl} color={colors.accent}>
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

      <FlatList
        keyExtractor={item => item.title}
        data={features}
        ref={scrollViewRef}
        nestedScrollEnabled
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.nav,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: colors.nav
        }}
        onMomentumScrollEnd={() => {
          getRef().current?.handleChildScrollEnd();
        }}
        renderItem={({item, index}) => <RenderItem item={item} index={index} />}
      />

      <View
        style={{
          borderRadius: 10,
          paddingHorizontal: 12,
        }}>
        {product?.type !== 'promo' ? (
          user ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom:10
              }}>
              <Paragraph
                onPress={() => {
                  setProduct({
                    type: 'monthly',
                    data: offers?.monthly
                  });
                }}
                style={{
                  color:
                    product?.type == 'monthly' ? colors.accent : colors.pri,
                  fontWeight: product?.type == 'monthly' ? 'bold' : 'normal',
                  paddingVertical: 15,
                  minWidth: 100,
                  textAlign: 'right'
                }}>
                Monthly
              </Paragraph>
              <Paragraph size={20} style={{paddingHorizontal: 12}}>
                {' | '}
              </Paragraph>
              <Paragraph
                onPress={() => {
                  setProduct({
                    type: 'yearly',
                    data: offers?.yearly
                  });
                }}
                style={{
                  color: product?.type == 'yearly' ? colors.accent : colors.pri,
                  fontWeight: product?.type == 'yearly' ? 'bold' : 'normal',
                  paddingVertical: 15,
                  minWidth: 100,
                  textAlign: 'left'
                }}>
                Yearly
              </Paragraph>
            </View>
          ) : null
        ) : (
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
        )}

        {product?.data ? (
          <>
            <Button
              onPress={buySubscription}
              fontSize={SIZE.lg}
              loading={buying}
              title={
                promo
                  ? promo.text
                  : user
                  ? `Subscribe for ${product?.data?.localizedPrice} / ${
                      product.type === 'yearly' ? 'yr' : 'mo'
                    }`
                  : 'Try free for 14 days'
              }
              type="accent"
              height={normalize(60)}
              width="100%"
            />
            {user ? (
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
                        let productId = await db.offers.getCode(
                          value,
                          Platform.OS
                        );
                        if (productId) {
                          getPromo(productId)
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
                    paragraph:
                      'Enter your promo code to get a special discount.'
                  });
                }}
                title="I have a promo code"
              />
            ) : null}
          </>
        ) : (
          <Paragraph
            color={colors.icon}
            style={{
              alignSelf: 'center',
              height: 50
            }}>
            This subscription is unavailable at the moment
          </Paragraph>
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
                By tapping Subscribe,
                <Paragraph size={SIZE.xs + 1} color={colors.accent}>
                  {product?.data?.localizedPrice}
                </Paragraph>{' '}
                will be charged to your iTunes Account for 1-
                {product?.type === 'yearly' ? 'year' : 'month'} subscription of
                Notesnook Pro.{'\n\n'}
                Subscriptions will automatically renew unless cancelled within
                24-hours before the end of the current period. You can cancel
                anytime with your iTunes Account settings.
              </Paragraph>
            ) : (
              <Paragraph
                textBreakStrategy="balanced"
                size={SIZE.xs + 1}
                color={colors.icon}
                style={{
                  alignSelf: 'center',
                  marginTop: 10,
                  textAlign: 'center'
                }}>
                By tapping Subscribe, your payment will be charged on your
                Google Account, and your subscription will automatically renew
                for the same package length at the same price until you cancel
                in settings in the Android Play Store prior to the end of the
                then current period.
              </Paragraph>
            )}

            <View
              style={{
                backgroundColor: colors.nav,
                width: '100%',
                paddingVertical: 10,
                marginTop: 5,
                borderRadius: 5,
                paddingHorizontal: 12
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
      </View>
      <Toast context="local" />
      <View
        style={{
          paddingBottom: 10
        }}
      />
    </View>
  );
};

const RenderItem = React.memo(
  ({item, index}) => {
    const [state] = useTracked();
    const colors = state.colors;

    return (
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center'
        }}>
        <Icon size={SIZE.lg} color={colors.accent} name="check" />
        <Paragraph
          style={{
            marginLeft: 10
          }}
          size={SIZE.md + 2}>
          {item.title}
        </Paragraph>
      </View>
    );
  },
  () => true
);
