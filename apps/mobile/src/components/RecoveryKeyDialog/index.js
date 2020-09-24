import React, {createRef} from 'react';
import {Clipboard, Text, View} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFetchBlob from 'rn-fetch-blob';
import {LOGO_BASE64} from '../../assets/images/assets';
import {SIZE, WEIGHT} from '../../common/common';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';
import {eOpenRecoveryKeyDialog} from '../../services/events';
import {ToastEvent, w} from '../../utils/utils';
import ActionSheet from '../ActionSheet';
import {Button} from '../Button';
import Seperator from '../Seperator';
import {Toast} from '../Toast';
class RecoveryKeyDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      key: 'a',
    };
    this.actionSheetRef = createRef();
    this.svg = createRef();
  }

  open = () => {
    this.actionSheetRef.current?._setModalVisible(true);
  };

  close = () => {
    this.actionSheetRef.current?._setModalVisible(false);
  };
  async componentDidMount() {
    this.actionSheetRef.current?._setModalVisible(true);
    eSubscribeEvent(eOpenRecoveryKeyDialog, this.open);
  }

  async componentWillUnmount() {
    eUnSubscribeEvent(eOpenRecoveryKeyDialog, this.open);
  }

  componentDidUpdate() {}

  saveQRCODE = () => {
    this.svg.current?.toDataURL((data) => {
      console.log(data);
      RNFetchBlob.fs
        .writeFile(
          RNFetchBlob.fs.dirs.SDCardDir +
            '/Notesnook/nn_recovery_key_qrcode.png',
          data,
          'base64',
        )
        .then((res) => {
          RNFetchBlob.fs
            .scanFile([
              {
                path:
                  RNFetchBlob.fs.dirs.SDCardDir +
                  '/Notesnook/nn_recovery_key_qrcode.png',
                mime: 'image/png',
              },
            ])
            .then((r) => {
              ToastEvent.show(
                'Recovery key saved to Gallery as ' +
                  RNFetchBlob.fs.dirs.SDCardDir +
                  '/Notesnook/nn_recovery_key_qrcode.png',
                'success',
                'local',
              );
            });
        });
    });
  };

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
            numberOfLines={2}
            style={{
              fontFamily: WEIGHT.bold,
              fontSize: SIZE.xl,
              width: '85%',
              maxWidth: '85%',
              paddingRight: 10,
              marginTop: 10,
              color: colors.heading,
            }}>
            Your Recovery Key
          </Text>

          <View
            style={{
              backgroundColor: colors.nav,
              borderRadius: 5,
              padding: 10,
              marginTop: 10,
            }}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.md,
                width: '100%',
                maxWidth: '100%',
                paddingRight: 10,
                color: colors.icon,
              }}>
              {this.state.key}
            </Text>
          </View>
          <Seperator />

          <View
            style={{
              alignSelf: 'center',
              marginBottom: 15,
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-between',
            }}>
            <QRCode
              getRef={this.svg}
              size={w / 2.2}
              value={this.state.key}
              logo={{uri: LOGO_BASE64}}
              logoBorderRadius={10}
            />

            <Seperator />
            <View
              style={{
                alignItems: 'center',
                width: w / 2.2,
                justifyContent: 'center',
              }}>
              <Button
                title="Save to Gallery"
                onPress={this.saveQRCODE}
                width="100%"
                height={40}
              />
              <Seperator />
              <Button
                onPress={() => {
                  RNFetchBlob.fs.writeFile(
                    RNFetchBlob.fs.dirs.SDCardDir +
                      '/Notesnook/nn_recovery_key.txt',
                    this.state.key,
                    'utf8',
                  );
                }}
                title="Save as Text File"
                width="100%"
                height={40}
              />
              <Seperator />
              <Button
                onPress={() => {
                  Clipboard.setString(this.state.key);
                  ToastEvent.show('Recovery key copied');
                }}
                title="Copy Key"
                width="100%"
                height={40}
              />
            </View>
          </View>

          <Seperator />
          <View
            style={{
              flexDirection: 'row',
              padding: 10,
              borderRadius: 10,
            }}>
            <Icon color={colors.errorText} size={SIZE.lg} name="alert-circle" />
            <Text
              style={{
                color: colors.errorText,
                fontFamily: WEIGHT.regular,
                marginLeft: 10,
                fontSize: SIZE.sm,
                width: '90%',
              }}>
              We request you to save your recovery key and keep it in multiple
              places. If you forget your password, you can only recover your
              data or reset your password using this recovery key.
            </Text>
          </View>

          <Toast context="local" />
        </View>
      </ActionSheet>
    );
  }
}

export default RecoveryKeyDialog;
