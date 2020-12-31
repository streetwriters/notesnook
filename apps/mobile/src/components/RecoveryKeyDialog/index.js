import React, { createRef } from 'react';
import { Clipboard, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFetchBlob from 'rn-fetch-blob';
import { LOGO_BASE64 } from '../../assets/images/assets';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/EventManager';
import { dWidth } from '../../utils';
import { db } from '../../utils/DB';
import { eOpenRecoveryKeyDialog, eOpenResultDialog } from '../../utils/Events';
import { SIZE } from '../../utils/SizeUtils';
import Storage from '../../utils/storage';
import { sleep } from '../../utils/TimeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import { Button } from '../Button';
import Seperator from '../Seperator';
import { Toast } from '../Toast';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
class RecoveryKeyDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      key: null,
      visible: false,
    };
    this.actionSheetRef = createRef();
    this.svg = createRef();
    this.user;
    this.signup = false;
  }

  open = (signup) => {
    if (signup) {
      this.signup = true;
    }
    this.setState(
      {
        visible: true,
      },
      () => {
        this.actionSheetRef.current?.setModalVisible(true);
      },
    );
  };

  close = () => {
    this.actionSheetRef.current?.setModalVisible(false);
    sleep(200).then(() => {
      this.setState({
        visible: false,
      });
    });
    if (this.signup) {
      setTimeout(() => {
        eSendEvent(eOpenResultDialog, {
          title: 'Welcome!',
          paragraph: 'Please verify your email to activate syncing.',
          icon: 'check',
          button: 'Thank You!',
        });
      }, 500);
    }
  };
  async componentDidMount() {
    eSubscribeEvent(eOpenRecoveryKeyDialog, this.open);
  }

  async componentWillUnmount() {
    eUnSubscribeEvent(eOpenRecoveryKeyDialog, this.open);
  }

  saveQRCODE = async () => {
    if ((await Storage.requestPermission()) === false) {
      ToastEvent.show('Storage access not granted!', 'error', 'local');
      return;
    }

    this.svg.current?.toDataURL(async (data) => {
      let path = await Storage.checkAndCreateDir('/');
      let fileName = 'nn_' + this.user.email + '_recovery_key_qrcode.png';
      RNFetchBlob.fs.writeFile(path + fileName, data, 'base64').then((res) => {
        RNFetchBlob.fs
          .scanFile([
            {
              path: path + fileName,
              mime: 'image/png',
            },
          ])
          .then((r) => {
            ToastEvent.show(
              'Recovery key saved to Gallery as ' + path + fileName,
              'success',
              'local',
            );
          });
      });
    });
  };

  saveToTextFile = async () => {
    if ((await Storage.requestPermission()) === false) {
      ToastEvent.show('Storage access not granted!', 'error', 'local');
      return;
    }
    let path = await Storage.checkAndCreateDir('/');
    let fileName = 'nn_' + this.user.email + '_recovery_key.txt';

    RNFetchBlob.fs
      .writeFile(path + fileName, this.state.key, 'utf8')
      .then((r) => {
        ToastEvent.show(
          'Recovery key saved as ' + path + fileName,
          'success',
          'local',
        );
      })
      .catch((e) => {});
  };

  onOpen = async () => {
    let k = await db.user.getEncryptionKey();
    this.user = await db.user.getUser();

    if (k) {
      this.setState({
        key: k.key,
      });
    }
  };

  render() {
    const {colors} = this.props;
    if (!this.state.visible) return null;
    return (
      <ActionSheetWrapper
        closeOnTouchBackdrop={false}
        gestureEnabled={false}
        onOpen={this.onOpen}
        fwdRef={this.actionSheetRef}>
        <View
          style={{
            width: dWidth,
            backgroundColor: colors.bg,
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            borderRadius: 10,
            paddingTop: 10,
          }}>
          <Heading
            numberOfLines={2}
            style={{
              width: '85%',
              maxWidth: '85%',
              paddingRight: 10,
              marginTop: 10,
            }}>
            Recovery Key
          </Heading>

          <View
            style={{
              backgroundColor: colors.nav,
              borderRadius: 5,
              padding: 10,
              marginTop: 10,
            }}>
            <Paragraph
              color={colors.icon}
              size={SIZE.md}
              numberOfLines={2}
              style={{
                width: '100%',
                maxWidth: '100%',
                paddingRight: 10,
              }}>
              {this.state.key}
            </Paragraph>
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
            {this.state.key ? (
              <QRCode
                getRef={this.svg}
                size={dWidth / 2.2}
                value={this.state.key}
                logo={{uri: LOGO_BASE64}}
                logoBorderRadius={10}
              />
            ) : null}

            <Seperator />
            <View
              style={{
                alignItems: 'center',
                width: dWidth / 2.2,
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
                onPress={this.saveToTextFile}
                title="Save as Text File"
                width="100%"
                height={40}
              />
              <Seperator />
              <Button
                onPress={() => {
                  Clipboard.setString(this.state.key);
                  ToastEvent.show('Copied!', 'success', 'local');
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
            <Paragraph
              color={colors.errorText}
              style={{
                marginLeft: 10,
                width: '90%',
              }}>
              We request you to save your recovery key and keep it in multiple
              places. If you forget your password, you can only recover your
              data or reset your password using this recovery key.
            </Paragraph>
          </View>
          <Seperator />
          <Button
            title="I have saved the key."
            width="100%"
            height={50}
            type="accent"
            onPress={this.close}
          />
          <Toast context="local" />
        </View>
      </ActionSheetWrapper>
    );
  }
}

export default RecoveryKeyDialog;
