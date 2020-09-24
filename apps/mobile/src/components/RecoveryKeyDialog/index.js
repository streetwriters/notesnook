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
      key: '',
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
          <View
            style={{
              borderRadius: 5,
              marginBottom: 15,
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
                color: colors.heading,
              }}>
              Your Recovery Key
            </Text>
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
            <Seperator />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
              <Button
                onPress={() => {
                  RNFetchBlob.fs.writeFile(
                    RNFetchBlob.fs.dirs.SDCardDir +
                      '/Notesnook/nn_recovery_key.txt',
                    this.state.key,
                    'utf8',
                  );
                }}
                title="Save as Text"
                width="48%"
                height={50}
              />
              <Button
                onPress={() => {
                  Clipboard.setString(this.state.key);
                  ToastEvent.show('Recovery key copied');
                }}
                title="Copy"
                width="48%"
                height={50}
              />
            </View>
          </View>

          <View
            style={{
              alignSelf: 'center',
              marginBottom: 15,
              flexDirection: 'row',
              width: '100%',
            }}>
            <QRCode
              getRef={this.svg}
              size={w / 2.2}
              value={this.state.key}
              logo={{uri: LOGO_BASE64}}
              logoBorderRadius={10}
            />

            <Text
              style={{
                paddingHorizontal: 10,
                fontSize: SIZE.md,
                maxWidth: '50%',
                fontFamily: WEIGHT.regular,
              }}>
              This is the QR-Code of your recovery key. You can use any QR-Code
              Scanner to scan this image and get your key and recover your data.
            </Text>
          </View>

          <Button
            title="Save QR-Code to Gallery"
            onPress={this.saveQRCODE}
            width="100%"
            height={50}
          />

          <Seperator />
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.errorBg,
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
