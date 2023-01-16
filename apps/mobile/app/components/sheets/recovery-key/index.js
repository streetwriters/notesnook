/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import Clipboard from "@react-native-clipboard/clipboard";
import React, { createRef } from "react";
import { Platform, View } from "react-native";
import FileViewer from "react-native-file-viewer";
import * as ScopedStorage from "react-native-scoped-storage";
import Share from "react-native-share";
//import { LOGO_BASE64 } from '../../../assets/images/assets';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from "../../../services/event-manager";
import { clearMessage } from "../../../services/message";
import SettingsService from "../../../services/settings";
import { db } from "../../../common/database";
import Storage from "../../../common/database/storage";
import { eOpenRecoveryKeyDialog } from "../../../utils/events";
import { sanitizeFilename } from "../../../utils/sanitizer";
import { SIZE } from "../../../utils/size";
import { sleep } from "../../../utils/time";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import SheetWrapper from "../../ui/sheet";
import { QRCode } from "../../ui/svg/lazy";
import Paragraph from "../../ui/typography/paragraph";

let RNFetchBlob;

class RecoveryKeySheet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      key: null,
      visible: false
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
        visible: true
      },
      () => {
        this.actionSheetRef.current?.setModalVisible(true);
      }
    );
  };

  close = () => {
    if (this.tapCount === 0) {
      ToastEvent.show({
        heading: "Did you save recovery key?",
        message: "Tap one more time to confirm.",
        type: "success",
        context: "local"
      });
      this.tapCount++;
      return;
    }
    this.tapCount = 0;
    this.actionSheetRef.current?.setModalVisible(false);
    sleep(200).then(() => {
      this.setState({
        visible: false
      });
    });
    SettingsService.set({
      recoveryKeySaved: true
    });
    clearMessage();
    // if (this.signup) {
    //   this.signup = false;
    //   setTimeout(() => {
    //     eSendEvent(eOpenResultDialog);
    //   }, 500);
    // }
  };
  async componentDidMount() {
    eSubscribeEvent(eOpenRecoveryKeyDialog, this.open);
  }

  async componentWillUnmount() {
    eUnSubscribeEvent(eOpenRecoveryKeyDialog, this.open);
  }

  saveQRCODE = async () => {
    this.svg.current?.toDataURL(async (data) => {
      try {
        let path;
        RNFetchBlob = (await import("rn-fetch-blob")).default;
        let fileName = "nn_" + this.user.email + "_recovery_key_qrcode";
        fileName = sanitizeFilename(fileName, { replacement: "_" });
        fileName = fileName + ".png";

        if (Platform.OS === "android") {
          await ScopedStorage.createDocument(
            fileName,
            "image/png",
            data,
            "base64"
          );
        } else {
          path = await Storage.checkAndCreateDir("/");
          await RNFetchBlob.fs.writeFile(path + fileName, data, "base64");
        }
        ToastEvent.show({
          heading: "Recovery key QR-Code saved",
          message:
            "QR-Code image has been saved to Gallery at " + path + fileName,
          type: "success",
          context: "local"
        });
      } catch (e) {
        console.error(e);
      }
    });
  };

  saveToTextFile = async () => {
    try {
      let path;
      let fileName = "nn_" + this.user?.email + "_recovery_key";
      fileName = sanitizeFilename(fileName, { replacement: "_" });
      fileName = fileName + ".txt";

      RNFetchBlob = (await import("rn-fetch-blob")).default;
      if (Platform.OS === "android") {
        let file = await ScopedStorage.createDocument(
          fileName,
          "text/plain",
          this.state.key,
          "utf8"
        );
        if (!file) return;
        path = file.uri;
      } else {
        path = await Storage.checkAndCreateDir("/");
        await RNFetchBlob.fs.writeFile(path + fileName, this.state.key, "utf8");
        path = path + fileName;
      }

      ToastEvent.show({
        heading: "Recovery key text file saved",
        message: "Recovery key saved in text file.",
        type: "success",
        context: "local"
      });
      return path;
    } catch (e) {
      alert(e.message);
    }
  };

  onOpen = async () => {
    let k = await db.user.getEncryptionKey();
    this.user = await db.user.getUser();
    if (k) {
      this.setState({
        key: k.key
      });
    }
  };

  shareFile = async () => {
    let path = await this.saveToTextFile();
    if (!path) return;
    try {
      if (Platform.OS === "ios") {
        Share.open({
          url: path,
          failOnCancel: false
        }).catch(console.log);
      } else {
        FileViewer.open(path, {
          showOpenWithDialog: true,
          showAppsSuggestions: true,
          shareFile: true
        }).catch(console.log);
      }
    } catch (e) {
      console.error(e);
    }
  };

  render() {
    const { colors } = this.props;
    if (!this.state.visible) return null;
    return (
      <SheetWrapper
        closeOnTouchBackdrop={false}
        gestureEnabled={false}
        onOpen={this.onOpen}
        fwdRef={this.actionSheetRef}
      >
        <View
          style={{
            width: "100%",
            backgroundColor: colors.bg,
            justifyContent: "space-between",
            paddingHorizontal: 12,
            borderRadius: 10,
            paddingTop: 10
          }}
        >
          <DialogHeader
            title="Save account recovery key"
            paragraph="If you forget your password, you can recover your
            data and reset your password only using this recovery key."
          />

          <View
            style={{
              borderRadius: 5,
              padding: 12,
              marginTop: 10
            }}
          >
            <Paragraph
              color={colors.pri}
              size={SIZE.sm}
              numberOfLines={2}
              selectable
              style={{
                width: "100%",
                maxWidth: "100%",
                paddingRight: 10,
                textAlign: "center",
                textDecorationLine: "underline"
              }}
            >
              {this.state.key}
            </Paragraph>
          </View>
          <Seperator />

          <View
            style={{
              alignSelf: "center",
              marginBottom: 15,
              flexDirection: "row",
              width: "100%",
              justifyContent: "center",
              position: "absolute",
              opacity: 0,
              zIndex: -1
            }}
          >
            {this.state.key ? (
              <QRCode
                getRef={this.svg}
                size={500}
                value={this.state.key}
                //logo={{ uri: LOGO_BASE64 }}
                logoBorderRadius={10}
              />
            ) : null}
          </View>

          <Button
            onPress={() => {
              Clipboard.setString(this.state.key);
              ToastEvent.show({
                heading: "Recovery key copied!",
                type: "success",
                context: "local"
              });
            }}
            icon="content-copy"
            title="Copy to clipboard"
            width="100%"
            type="grayAccent"
            fontSize={SIZE.md}
            height={50}
          />
          <Seperator />
          <Button
            title="Save QR-Code to gallery"
            onPress={this.saveQRCODE}
            width="100%"
            type="grayAccent"
            fontSize={SIZE.md}
            icon="qrcode"
            height={50}
          />
          <Seperator />
          <Button
            onPress={this.saveToTextFile}
            title="Save to text file"
            width="100%"
            type="grayAccent"
            icon="text"
            fontSize={SIZE.md}
            height={50}
          />
          <Seperator />

          <Button
            onPress={this.shareFile}
            title="Share to Cloud"
            width="100%"
            type="grayAccent"
            icon="cloud"
            fontSize={SIZE.md}
            height={50}
          />
          <Seperator />

          <Paragraph
            color={colors.icon}
            size={SIZE.sm}
            numberOfLines={2}
            style={{
              width: "100%",
              maxWidth: "100%",
              marginBottom: 5,
              textAlign: "center"
            }}
          >
            Tap twice to confirm you have saved the recovery key.
          </Paragraph>
          <Button
            title="I have saved the key."
            width="100%"
            height={50}
            type="error"
            fontSize={SIZE.md}
            onPress={this.close}
          />
        </View>
      </SheetWrapper>
    );
  }
}

export default RecoveryKeySheet;
