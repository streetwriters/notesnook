import React, {createRef} from 'react';
import {Platform, ScrollView, TouchableOpacity, View} from 'react-native';
import * as RNIap from 'react-native-iap';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFetchBlob from 'rn-fetch-blob';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import {dHeight, dWidth, itemSkus} from '../../utils';
import {hexToRGBA} from '../../utils/ColorUtils';
import {db} from '../../utils/DB';
import {eOpenLoginDialog, eOpenPendingDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import ActionSheet from '../ActionSheet';
import {Button} from '../Button';
import Seperator from '../Seperator';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
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
        this.actionSheetRef.current?._setModalVisible(true);
      },
    );
  }

  close() {
    this.actionSheetRef.current?._setModalVisible(false);
  }

  async getSkus() {
    try {
      let u = await db.user.get();
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
    } catch (e) {
      console.log(e, 'SKU ERROR');
    }
  }

  render() {
    const {colors} = this.props;
    return !this.state.visible ? null : (
      <ActionSheet
        containerStyle={{
          backgroundColor: colors.bg,
          width: DDS.isLargeTablet() ? 500 : '100%',
          alignSelf: 'center',
          borderRadius: 10,
          marginBottom: DDS.isLargeTablet() ? 50 : 0,
          borderBottomRightRadius: 0,
          borderBottomLeftRadius: 0,
        }}
        indicatorColor={
          Platform.ios
            ? hexToRGBA(colors.accent + '19')
            : hexToRGBA(colors.shade)
        }
        onOpen={async () => {
          try {
            await this.getSkus();
          } catch (e) {
            console.log(e);
          }
        }}
        extraScroll={DDS.isLargeTablet() ? 50 : 10}
        footerAlwaysVisible={DDS.isLargeTablet()}
        footerHeight={DDS.isLargeTablet() ? 20 : 10}
        footerStyle={
          DDS.isLargeTablet()
            ? {
                borderRadius: 10,
                backgroundColor: colors.bg,
              }
            : null
        }
        onClose={() => {
          this.setState({
            visible: false,
          });
        }}
        gestureEnabled={true}
        ref={this.actionSheetRef}
        initialOffsetFromBottom={1}>
        <View
          style={{
            width: DDS.isLargeTablet() ? 500 : dWidth,
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
            Notesnook Pro
          </Heading>

          <ScrollView
            nestedScrollEnabled={true}
            onScrollEndDrag={this.actionSheetRef.current?.childScrollHandler}
            onScrollAnimationEnd={
              this.actionSheetRef.current?.childScrollHandler
            }
            onMomentumScrollEnd={
              this.actionSheetRef.current?.childScrollHandler
            }
            style={{
              width: '100%',
              maxHeight: DDS.isLargeTablet() ? dHeight * 0.35 : dHeight * 0.45,
            }}>                  
            {[
              {
                title: 'Cross Platfrom Sync',
                description:
                  'Securely sync your notes on any device, Android, iOS, Windows, MacOS, Linux and Web!',
              },
              {
                title: 'Zero Knowledge',
                description:
                  'No sneaking, no stealing. We give all the keys for your data to you. Privacy is not just a word to us. We use industry-grade XChaChaPoly1305 and Argon2 which is miles ahead other solutions making sure your data is secure and private even a million years from now.',
              },
              {
                title: 'Organize Notes Like Never Before',
                description:
                  'Organize your notes using notebooks, tags and colors. Add notes to favorites for quick access. Pin most important notes and notebooks on top for quick access. You can also pin notes and notebooks to quickly access them!',
              },
              {
                title: 'Full Rich Text Editor with Markdown',
                description:
                  'Unleash the power of a complete Rich Text Editor in your notes app. You can add images, links and even embed videos! We have even added full markdown support too!',
              },
              {
                title: 'Export Notes',
                description:
                  'You can export your notes as PDF, Markdown, Plain text or HTML file.',
              },
              {
                title: 'Backup and Restore',
                description:
                  'Backup and restore your notes anytime into your phone storage. You can encrypt all your backups if required!',
              },
            ].map((item) => (
              <View
                key={item.title}
                style={{
                  paddingVertical: 5,
                  marginBottom: 10,
                }}>
                <View
                  style={{
                    alignItems: 'flex-start',
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    flexWrap: 'wrap',
                    width: '100%',
                  }}>
                  <Icon
                    name="checkbox-marked-circle"
                    size={SIZE.lg}
                    color={colors.accent}
                  />

                  <Heading
                    size={SIZE.md}
                    style={{
                      marginLeft: 10,
                      maxWidth: '85%',
                    }}>
                    {item.title} {'\n'}
                    <Paragraph
                      SIZE={SIZE.xs}
                      color={colors.icon}
                      style={{
                        marginLeft: 10,
                        maxWidth: '85%',
                        fontWeight: '400',
                      }}>
                      {item.description}
                    </Paragraph>
                  </Heading>
                </View>
              </View>
            ))}
          </ScrollView>

          <Seperator />

          <View
            style={{
              padding: 5,
              borderRadius: 10,
              backgroundColor: colors.shade,
              paddingHorizontal: 12,
            }}>
            <Heading size={SIZE.xl} color={colors.accent}>
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

            <View
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
                  <Paragraph
                    size={SIZE.lg}
                   >
                    {item.localizedPrice}
                    <Paragraph color={colors.accent} size={SIZE.sm}>
                      /mo
                    </Paragraph>
                  </Paragraph>
                </TouchableOpacity>
              ))}
            </View>

            <Seperator half />
            <Button
              onPress={async () => {
                if (!this.state.user) {
                  this.close();
                  setTimeout(() => {
                    eSendEvent(eOpenLoginDialog);
                  }, 400);
                } else {
                  RNIap.requestSubscription(this.state.product?.productId)
                    .then((r) => {})
                    .catch((e) => {
                      console.log(e);
                    });
                  this.close();
                }
              }}
              title={this.state.user ? 'Subscribe' : 'Sign Up'}
              type="accent"
              height={50}
              width="100%"
            />
          </View>
        </View>
      </ActionSheet>
    );
  }
}

export default PremiumDialog;
