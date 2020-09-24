import React, {createRef} from 'react';
import {ScrollView, Text, View} from 'react-native';
import * as RNIap from 'react-native-iap';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {SIZE, WEIGHT} from '../../common/common';
import {eSendEvent} from '../../services/eventManager';
import {eOpenLoginDialog} from '../../services/events';
import {db, h, itemSkus, w} from '../../utils/utils';
import ActionSheet from '../ActionSheet';
import {Button} from '../Button';
import Seperator from '../Seperator';
class PremiumDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      product: null,
    };
    this.routeIndex = 0;
    this.count = 0;
    this.actionSheetRef = createRef();
  }

  open() {
    this.actionSheetRef.current?._setModalVisible(true);
  }

  close() {
    this.actionSheetRef.current?._setModalVisible(false);
  }
  async componentDidMount() {
    let u = await db.user.get();
    let prod = await RNIap.getSubscriptions(itemSkus);
    console.log(prod);
    this.setState({
      user: u && u.Id ? u : null,
      product: prod[0],
    });
  }
  componentDidUpdate() {}

  render() {
    const {colors} = this.props;
    return (
      <ActionSheet
        containerStyle={{
          backgroundColor: colors.bg,
          width: '100%',
          alignSelf: 'center',
          borderRadius: 10,
        }}
        gestureEnabled={true}
        ref={this.actionSheetRef}
        initialOffsetFromBottom={1}>
        <View
          style={{
            width: w,
            backgroundColor: colors.bg,
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            borderRadius: 10,
            paddingTop: 10,
          }}>
          <Text
            style={{
              fontSize: SIZE.xxxl,
              fontFamily: WEIGHT.bold,
              color: colors.heading,
              paddingBottom: 20,
              paddingTop: 10,
              alignSelf:'center'
            }}>
            Notesnook Pro
          </Text>

          <ScrollView
            style={{
              width: '100%',
              maxHeight: h * 0.5,
            }}
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={false}>
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

                  <Text
                    style={{
                      marginLeft: 10,
                      fontFamily: WEIGHT.regular,
                      fontSize: SIZE.md,
                      maxWidth: '85%',
                      color: colors.heading,
                    }}>
                    {item.title} {'\n'}
                    <Text
                      style={{
                        marginLeft: 10,
                        fontFamily: WEIGHT.regular,
                        fontSize: SIZE.xs + 1,
                        maxWidth: '85%',
                        color: colors.icon,
                      }}>
                      {item.description}
                    </Text>
                  </Text>
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
            <Text
              style={{
                fontSize: SIZE.xl,
                fontFamily: WEIGHT.bold,
                color: colors.accent,
              }}>
              {!this.state.user ? 'Try it Now' : 'Upgrade Now'}
              {'\n'}
              <Text
                style={{
                  fontSize: 12,
                  color: colors.pri,
                  fontFamily: WEIGHT.regular,
                }}>
                Start your 14 Day Free Trial (no credit card needed)
              </Text>
            </Text>
            <Text
              style={{
                fontSize: SIZE.xl,
                fontFamily: WEIGHT.medium,
                color: colors.pri,
                paddingVertical: 15,
              }}>
              {this.state.product?.localizedPrice}
              <Text
                style={{
                  color: colors.accent,
                  fontSize: 12,
                }}>
                /mo
              </Text>
            </Text>
            <Button
              onPress={() => {
                if (!this.state.user) {
                  this.close();
                  setTimeout(() => {
                    eSendEvent(eOpenLoginDialog);
                  }, 400);
                } else {
                  // Request
                }
              }}
              title={this.state.user ? 'Buy Subscription' : 'Sign Up Now'}
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
