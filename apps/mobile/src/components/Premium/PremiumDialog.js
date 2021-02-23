import React, {createRef, useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import * as RNIap from 'react-native-iap';
import Carousel from 'react-native-snap-carousel';
import {SvgXml} from 'react-native-svg';
import {
  ACCENT_SVG,
  BACKUP_SVG,
  COMMUNITY_SVG,
  EXPORT_SVG,
  ORGANIZE_SVG,
  RICH_TEXT_SVG,
  SYNC_SVG,
  VAULT_SVG,
} from '../../assets/images/assets';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import {dWidth, itemSkus} from '../../utils';
import {db} from '../../utils/DB';
import {eOpenLoginDialog} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {SIZE} from '../../utils/SizeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {Button} from '../Button';
import {Toast} from '../Toast';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const features = [
  {
    title: 'Automatic sync',
    description:
      'Your notes will be automatically encrypted and synced to all your devices.',
    icon: SYNC_SVG,
  },
  {
    title: 'Unlimited organization',
    description:
      'Make unlimited notebooks and tags. Assign colors to your notes for quick access.',
    icon: ORGANIZE_SVG,
  },
  {
    title: 'Secure vault',
    description:
      'Lock any note with a password and keep sensitive data under lock and key.',
    icon: VAULT_SVG,
  },
  {
    title: 'Full rich text editor',
    description:
      ' Add images, links, tables, lists and embed videos. Use markdown for fast editing.',
    icon: RICH_TEXT_SVG,
  },
  {
    title: 'Export notes',
    description: 'You can export your notes in PDF, Markdown and HTML formats.',
    icon: EXPORT_SVG,
  },
  {
    title: 'Automatic and encrypted backups',
    description:
      'Enable daily or weekly backups of your data with automatic encryption.',
    icon: BACKUP_SVG,
  },
  {
    title: 'Customize Notesnook',
    description:
      'Change app colors, turn on automatic theme switching and change default home page.',
    icon: ACCENT_SVG,
  },
  {
    title: 'Get a Pro badge on Discord',
    description:
      'Pro users get access to special channels and priority support on our Discord server ',
    icon: COMMUNITY_SVG,
  },
];

class PremiumDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
    this.actionSheetRef = createRef();
  }

  open() {
    this.setState(
      {
        visible: true,
      },
      () => {
        this.actionSheetRef.current?.setModalVisible(true);
      },
    );
  }

  close = () => {
    this.actionSheetRef.current?.setModalVisible(false);
  };

  onClose = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    return !this.state.visible ? null : (
      <ActionSheetWrapper onClose={this.onClose} fwdRef={this.actionSheetRef}>
        <InnerComponent close={this.close} />
      </ActionSheetWrapper>
    );
  }
}

export default PremiumDialog;

const InnerComponent = React.memo(
  ({close}) => {
    const [state, dispatch] = useTracked();
    const colors = state.colors;
    const [user, setUser] = useState(null);
    const [product, setProduct] = useState(null);
    const [products, setProducts] = useState([]);
    const scrollViewRef = useRef();

    const getSkus = async () => {
      try {
        let _user = await db.user.getUser();
        setUser(_user);
        if (PremiumService.getProducts().length > 0) {
          setProduct(PremiumService.getProducts()[0]);
          setProducts(PremiumService.getProducts());
        } else {
          let prod = await RNIap.getSubscriptions(itemSkus);
          setProduct(prod[0]);
          setProducts(prod);
        }
      } catch (e) {}
    };

    useEffect(() => {
      getSkus();
    }, []);

    return (
      <View
        style={{
          width: '100%',
          backgroundColor: colors.bg,
          justifyContent: 'space-between',
          borderRadius: 10,
          paddingTop: 10,
        }}>
        <Heading
          size={SIZE.xxxl}
          style={{
            paddingBottom: 20,
            paddingTop: 0,
            alignSelf: 'center',
          }}>
          Notesnook{' '}
          <Heading size={SIZE.xxxl} color={colors.accent}>
            Pro
          </Heading>
        </Heading>

        <Carousel
          ref={scrollViewRef}
          data={features}
          layout="stack"
          itemWidth={DDS.isTab ? 475 : dWidth}
          sliderWidth={DDS.isTab ? 475 : dWidth}
          autoplay
          loop
          autoplayInterval={3000}
          autoplayDelay={1000}
          renderItem={({item, index}) => (
            <RenderItem item={item} index={index} />
          )}
        />

        <View
          style={{
            padding: 5,
            borderRadius: 10,
            paddingHorizontal: 12,
          }}>
          <Button
            onPress={async () => {
              if (!user) {
                close();
                setTimeout(() => {
                  eSendEvent(eOpenLoginDialog);
                }, 400);
              } else {
                RNIap.requestSubscription(
                  product?.productId,
                  false,
                  null,
                  null,
                  null,
                  user.id,
                )
                  .then((r) => {
                    close();
                  })
                  .catch((e) => {
                    console.log(e);
                  });
              }
            }}
            fontSize={SIZE.md}
            title={
              !user
                ? `Subscribe for ${product?.localizedPrice || '$4.49'} / Month`
                : 'Start Your Free 14 Day Trial'
            }
            type="accent"
            height={50}
            width="100%"
          />

          {user ? (
            <Paragraph
              style={{
                alignSelf: 'center',
                marginTop: 5,
              }}>
              (No credit card required.)
            </Paragraph>
          ) : null}

          {user ? (
            <>
              <Paragraph
                textBreakStrategy="balanced"
                style={{
                  alignSelf: 'center',
                  marginTop: 5,
                  textAlign: 'center',
                }}>
                By tapping Subscribe, {product?.localizedPrice || '$4.49'} will
                be charged to your iTunes Account for 1-month subscription of
                Notesnook Pro.{'\n\n'}
                Subscriptions will automatically renew unless cancelled within
                24-hours before the end of the current period. You can cancel
                anytime with your iTunes Account settings.
              </Paragraph>

              <View
                style={{
                  backgroundColor: colors.nav,
                  width: '100%',
                  paddingVertical: 10,
                  marginTop: 10,
                  borderRadius: 5,
                  paddingHorizontal: 12,
                }}>
                <Paragraph
                  style={{
                    maxWidth: '100%',
                    textAlign: 'center',
                  }}>
                  By tapping Subscribe, you agree to our{' '}
                  <Paragraph
                    onPress={() => {
                      openLinkInBrowser('https://notesnook.com/tos', colors)
                        .catch((e) => {})
                        .then((r) => {
                          console.log('closed');
                        });
                    }}
                    color={colors.accent}>
                    Terms of Service{' '}
                  </Paragraph>
                  and{' '}
                  <Paragraph
                    onPress={() => {
                      openLinkInBrowser('https://notesnook.com/privacy', colors)
                        .catch((e) => {})
                        .then((r) => {
                          console.log('closed');
                        });
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
      </View>
    );
  },
  () => true,
);

const RenderItem = React.memo(
  ({item, index}) => {
    const [state, dispatch] = useTracked();
    const colors = state.colors;

    return (
      <View
        key={item.description}
        style={{
          paddingVertical: 5,
          marginBottom: 10,
          width: '100%',
          backgroundColor: colors.bg,
        }}>
        <View
          style={{
            width: '95%',
            alignItems: 'center',
            alignSelf: 'center',
          }}>
          <SvgXml xml={item.icon(colors.accent)} width={170} height={170} />

          <Heading
            size={SIZE.lg}
            style={{
              textAlign: 'center',
              alignSelf: 'center',
              marginTop: 10,
            }}>
            {item.title}
          </Heading>

          <Paragraph
            size={SIZE.md}
            color={colors.icon}
            textBreakStrategy="balanced"
            style={{
              fontWeight: 'normal',
              textAlign: 'center',
              alignSelf: 'center',
              maxWidth: '80%',
            }}>
            {item.description}
          </Paragraph>
        </View>
      </View>
    );
  },
  () => true,
);
