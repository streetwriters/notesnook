import React, {createRef} from 'react';
import {Clipboard, View} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {LOGO_BASE64} from '../../assets/images/assets';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {dWidth} from '../../utils';
import {db} from '../../utils/DB';
import {eOpenRecoveryKeyDialog, eOpenResultDialog} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import Storage from '../../utils/storage';
import {sleep} from '../../utils/TimeUtils';
import ActionSheetWrapper from '../ActionSheetComponent/ActionSheetWrapper';
import {Button} from '../Button';
import DialogHeader from '../Dialog/dialog-header';
import Seperator from '../Seperator';
import {Toast} from '../Toast';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

let RNFetchBlob;

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
    this.tapCount = 0;
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
    if (this.tapCount === 0) {
      ToastEvent.show('Tap one more time to confirm.', 'error', 'local');
      this.tapCount++;
      return;
    }
    this.tapCount = 0;
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
      RNFetchBlob = require("rn-fetch-blob").default
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
    RNFetchBlob = require('rn-fetch-blob')
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
            width: '100%',
            backgroundColor: colors.bg,
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            borderRadius: 10,
            paddingTop: 10,
          }}>
          <DialogHeader
            title="Your data recovery key"
            paragraph="If you forget your password, you can recover your
            data and reset your password using your data recovery key."
          />

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

            <Button
              onPress={() => {
                Clipboard.setString(this.state.key);
                ToastEvent.show('Copied!', 'success', 'local');
              }}
              icon="content-copy"
              title="Copy to clipboard"
              width="100%"
              type="gray"
              fontSize={SIZE.md}
              height={50}
            />
          </View>
          <Seperator />

          <View
            style={{
              alignSelf: 'center',
              marginBottom: 15,
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'center',
              position: 'absolute',
              opacity: 0,
            }}>
            {this.state.key ? (
              <QRCode
                getRef={this.svg}
                size={500}
                value={this.state.key}
                logo={{uri: LOGO_BASE64}}
                logoBorderRadius={10}
              />
            ) : null}
          </View>

          <Button
            title="Save QR-Code to gallery"
            onPress={this.saveQRCODE}
            width="100%"
            type="accent"
            fontSize={SIZE.md}
            height={50}
          />
          <Seperator />
          <Button
            onPress={this.saveToTextFile}
            title="Save to text file"
            width="100%"
            type="accent"
            fontSize={SIZE.md}
            height={50}
          />
          <Seperator />
          <Button
            title="I have saved the key."
            width="100%"
            height={50}
            type="error"
            fontSize={SIZE.md}
            onPress={this.close}
          />
          <Toast context="local" />
        </View>
      </ActionSheetWrapper>
    );
  }
}

export default RecoveryKeyDialog;
