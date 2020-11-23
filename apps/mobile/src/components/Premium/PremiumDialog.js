import React, {createRef} from 'react';
import {ScrollView, Text, View} from 'react-native';
import * as RNIap from 'react-native-iap';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import {eOpenLoginDialog, eOpenPendingDialog} from '../../utils/Events';
import {dHeight, itemSkus, dWidth} from '../../utils';
import ActionSheet from '../ActionSheet';
import {Button} from '../Button';
import Seperator from '../Seperator';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import {db} from '../../utils/DB';
import {DDS} from '../../services/DeviceDetection';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
class PremiumDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      product: null,
      scrollEnabled: false,
    };
    this.routeIndex = 0;
    this.count = 0;
    this.actionSheetRef = createRef();
    this.subsriptionSuccessListerner = RNIap.purchaseUpdatedListener(
      this.onSuccessfulSubscription,
    );
    this.subsriptionErrorListener = RNIap.purchaseErrorListener(
      this.onSubscriptionError,
    );
    this.prevScroll = 0;
  }

  open() {
    this.actionSheetRef.current?._setModalVisible(true);
  }

  close() {
    this.actionSheetRef.current?._setModalVisible(false);
  }

  async getSkus() {
    try {
      let u = await db.user.get();
      let prod = await RNIap.getSubscriptions(itemSkus);
      this.setState({
        user: u && u.Id ? u : null,
        product: prod[0],
      });
    } catch (e) {
      console.log(e, 'SKU ERROR');
    }
  }

  onSuccessfulSubscription = (subscription) => {
    const receipt = subscription.transactionReceipt;

    if (receipt) {
      this.close();
      setTimeout(() => {
        eSendEvent(eOpenPendingDialog);
      }, 500);
    }
  };

  onSubscriptionError = (error) => {
    console.log(error.message, 'Error');
    ToastEvent.show(error.message);
  };

  render() {
    const {colors} = this.props;
    return (
      <ActionSheet
        containerStyle={{
          backgroundColor: colors.bg,
          width: DDS.isTab ? 500 : '100%',
          alignSelf: 'center',
          borderRadius: 10,
          marginBottom: DDS.isTab ? 50 : 0,
          borderBottomRightRadius: 0,
          borderBottomLeftRadius: 0,
        }}
        onOpen={async () => {
          await this.getSkus();
        }}
        extraScroll={DDS.isTab ? 50 : 0}
        footerAlwaysVisible={DDS.isTab}
        footerHeight={DDS.isTab ? 20 : 10}
        footerStyle={
          DDS.isTab
            ? {
                borderRadius: 10,
                backgroundColor: colors.bg,
              }
            : null
        }
        gestureEnabled={true}
        ref={this.actionSheetRef}
        initialOffsetFromBottom={1}>
        <View
          style={{
            width: DDS.isTab ? 500 : dWidth,
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
            Get Notesnook Pro
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
              maxHeight: DDS.isTab ? dHeight * 0.35 : dHeight * 0.5,
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
                }}>
                {this.state.user
                  ? 'Cancel anytime in Subscriptions on Google Play'
                  : 'Start your 14 Day Trial for Free (no credit card needed)'}
              </Paragraph>
            </Heading>
            <Paragraph
              size={SIZE.xl}
              style={{
                fontSize: SIZE.xl,
                paddingVertical: 15,
              }}>
              {this.state.product?.localizedPrice}
              <Paragraph color={colors.accent} size={SIZE.sm}>
                /mo
              </Paragraph>
            </Paragraph>
            <Button
              onPress={() => {
                if (!this.state.user) {
                  this.close();
                  setTimeout(() => {
                    eSendEvent(eOpenLoginDialog);
                  }, 400);
                } else {
                  RNIap.requestSubscription(this.state.product.productId)
                    .then((r) => {})
                    .catch((e) => {
                      console.log(e);
                    });
                }
              }}
              title={
                this.state.user ? 'Subscribe to Notesnook Pro' : 'Sign Up Now'
              }
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
