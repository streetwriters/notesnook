import React, {createRef} from 'react';
import {Platform, ScrollView, TouchableOpacity, View} from 'react-native';
import * as RNIap from 'react-native-iap';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import {dHeight, dWidth, itemSkus} from '../../utils';
import {db} from '../../utils/DB';
import {eOpenLoginDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {Button} from '../Button';
import Seperator from '../Seperator';
import {Toast} from '../Toast';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import Carousel from 'react-native-snap-carousel';
import {SvgXml} from 'react-native-svg';
import {ACCENT_SVG, BACKUP_SVG, COMMUNITY_SVG, EXPORT_SVG, NOTE_SVG, ORGANIZE_SVG, RICH_TEXT_SVG, SYNC_SVG, VAULT_SVG} from '../../assets/images/assets';
class PremiumDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      products: null,
      scrollEnabled: false,
      product: null,
      visible: false,
    };
    this.routeIndex = 0;
    this.count = 0;
    this.actionSheetRef = createRef();
    this.prevScroll = 0;
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

  close() {
    this.actionSheetRef.current?.setModalVisible(false);
  }

  async getSkus() {
    try {
      let u = await db.user.getUser();
      this.setState({
        user: u,
      });
      await RNIap.initConnection();
      let prod = await RNIap.getSubscriptions(itemSkus);
      console.log(prod);
      this.setState({
        products: prod,
        product: prod[0],
      });
    } catch (e) {}
  }


  features = [
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
      description:
        'You can export your notes in PDF, Markdown and HTML formats.',
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

  render() {
    const {colors} = this.props;
    return !this.state.visible ? null : (
      <ActionSheetWrapper
        onOpen={async () => {
          try {
            await this.getSkus();
          } catch (e) {}
        }}
        onClose={() => {
          this.setState({
            visible: false,
          });
        }}
        fwdRef={this.actionSheetRef}>
        <View
          style={{
            width: '100%',
            backgroundColor: colors.bg,
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            borderRadius: 10,
            paddingTop: 10,
          }}>
          <Heading
            size={SIZE.xxxl}
            style={{
              paddingBottom: 20,
              paddingTop: 10,
              alignSelf: 'center',
            }}>
            Notesnook{' '}
            <Heading size={SIZE.xxxl} color={colors.accent}>
              Pro
            </Heading>
          </Heading>

          <ScrollView
            nestedScrollEnabled={true}
            onScrollEndDrag={this.actionSheetRef.current?.handleChildScrollEnd}
            onScrollAnimationEnd={
              this.actionSheetRef.current?.handleChildScrollEnd
            }
            onMomentumScrollEnd={
              this.actionSheetRef.current?.handleChildScrollEnd
            }
            style={{
              width: '100%',
              maxHeight: DDS.isLargeTablet() ? dHeight * 0.45 : dHeight * 0.55,
            }}>
            <Carousel
              data={this.features}
              itemWidth={DDS.isTab ? 475 : dWidth}
              sliderWidth={DDS.isTab ? 475 : dWidth}
              autoplay
              loop
              autoplayInterval={5000}
              autoplayDelay={3000}
              renderItem={({item, index}) => (
                <View
                  key={item.description}
                  style={{
                    paddingVertical: 5,
                    marginBottom: 10,
                    width:"100%",
                  }}>
                  <View
                    style={{
                      width: '95%',
                      alignItems: 'center',
                      alignSelf:'center'
                    }}>
                    <SvgXml
                      xml={item.icon(colors.accent)}
                      width={170}
                      height={170}
                    />

                    <Heading
                      size={SIZE.lg}
                      style={{
                        textAlign: 'center',
                        alignSelf: 'center',
                        marginTop:10
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
                        maxWidth: "80%"
                      }}>
                      {item.description}
                    </Paragraph>
                  </View>
                </View>
              )}
            />
          </ScrollView>

          <Seperator />

          <View
            style={{
              padding: 5,
              borderRadius: 10,
              paddingHorizontal: 12,
            }}>
            {/*  <Heading size={SIZE.xl} color={colors.accent}>
              {!this.state.user ? 'Try it Now' : 'Upgrade Now'}
              {'\n'}
              <Paragraph
                size={SIZE.sm}
                style={{
                  fontWeight: '400',
                  lineHeight: 17,
                }}>
                {this.state.user
                  ? `You can cancel anytime from subscriptions on${
                      Platform.OS === 'android' ? ' Google Play' : ' App Store'
                    }`
                  : 'Start your 14 Day Trial Today (no credit card required.)'}
              </Paragraph>
            </Heading>
 */}
            {/*   <View
              style={{
                flexDirection: 'row',
                paddingVertical: 5,
                marginTop: 10,
              }}>
              {this.state.products?.map((item) => (
                <TouchableOpacity
                  onPress={() => {
                    this.setState({
                      product: item,
                    });
                  }}
                  style={{
                    borderWidth: 1,
                    borderColor: this.state.product?.productId
                      ? colors.accent
                      : 'transparent',
                    borderRadius: 5,
                    padding: 5,
                    paddingVertical: 10,
                    marginRight: 10,
                  }}>

                  <Paragraph size={SIZE.lg}>
                    {!item.localizedPrice && item.currency + ' '}
                    {item.localizedPrice || item.price}
                    <Paragraph color={colors.accent} size={SIZE.sm}>
                      /mo
                    </Paragraph>
                  </Paragraph>
                </TouchableOpacity>
              ))}
            </View> */}

            <Seperator half />
            <Button
              onPress={async () => {
                if (!this.state.user) {
                  this.close();
                  setTimeout(() => {
                    eSendEvent(eOpenLoginDialog);
                  }, 400);
                } else {
                  RNIap.requestSubscription(
                    this.state.product?.productId,
                    false,
                    null,
                    null,
                    null,
                    this.state.user.id,
                  )
                    .then((r) => {
                      this.close();
                    })
                    .catch((e) => {
                      console.log(e);
                    });
                }
              }}
              fontSize={SIZE.md}
              title={
                this.state.user ? 'Subscribe' : 'Start Your Free 14 Day Trial'
              }
              type="accent"
              height={50}
              width="100%"
            />

            <Paragraph
              style={{
                alignSelf: 'center',
                marginTop: 5,
              }}>
              (No credit card required.)
            </Paragraph>
          </View>
          <Toast context="local" />
        </View>
      </ActionSheetWrapper>
    );
  }
}

export default PremiumDialog;
