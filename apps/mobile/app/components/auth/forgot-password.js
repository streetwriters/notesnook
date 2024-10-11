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

import React, { useRef, useState } from "react";
import { View } from "react-native";
import ActionSheet from "react-native-actions-sheet";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { ToastManager } from "../../services/event-manager";
import SettingsService from "../../services/settings";
import { useThemeColors } from "@notesnook/theme";
import DialogHeader from "../dialog/dialog-header";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { strings } from "@notesnook/intl";

export const ForgotPassword = () => {
  const { colors } = useThemeColors("sheet");
  const email = useRef();
  const emailInputRef = useRef();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendRecoveryEmail = async () => {
    if (!email.current || error) {
      ToastManager.show({
        heading: strings.emailRequired(),
        type: "error",
        context: "local"
      });
      return;
    }
    setLoading(true);
    try {
      let lastRecoveryEmailTime = SettingsService.get().lastRecoveryEmailTime;
      if (
        lastRecoveryEmailTime &&
        Date.now() - JSON.parse(lastRecoveryEmailTime) < 60000 * 3
      ) {
        throw new Error(strings.pleaseWaitBeforeSendEmail());
      }
      await db.user.recoverAccount(email.current.toLowerCase());
      SettingsService.set({
        lastRecoveryEmailTime: Date.now()
      });
      ToastManager.show({
        heading: strings.recoveryEmailSent(),
        message: strings.recoveryEmailSentDesc(),
        type: "success",
        context: "local",
        duration: 7000
      });
      setLoading(false);
      setSent(true);
    } catch (e) {
      setLoading(false);
      ToastManager.show({
        heading: strings.recoveryEmailFailed(),
        message: e.message,
        type: "error",
        context: "local"
      });
    }
  };

  return (
    <>
      <ActionSheet
        onBeforeShow={(data) => (email.current = data)}
        onClose={() => {
          setSent(false);
          setLoading(false);
        }}
        keyboardShouldPersistTaps="always"
        onOpen={() => {
          emailInputRef.current?.setNativeProps({
            text: email.current
          });
        }}
        indicatorStyle={{
          width: 100
        }}
        gestureEnabled
        id="forgotpassword_sheet"
      >
        {sent ? (
          <View
            style={{
              padding: 12,
              justifyContent: "center",
              alignItems: "center",
              paddingBottom: 50
            }}
          >
            <IconButton
              style={{
                width: null,
                height: null
              }}
              color={colors.primary.accent}
              name="email"
              size={50}
            />
            <Heading>{strings.recoveryEmailSent()}</Heading>
            <Paragraph
              style={{
                textAlign: "center"
              }}
            >
              {strings.recoveryEmailSentDesc()}
            </Paragraph>
          </View>
        ) : (
          <View
            style={{
              borderRadius: DDS.isTab ? 5 : 0,
              backgroundColor: colors.primary.background,
              zIndex: 10,
              width: "100%",
              padding: 12
            }}
          >
            <DialogHeader title={strings.accountRecovery()} />
            <Seperator />

            <Input
              fwdRef={emailInputRef}
              onChangeText={(value) => {
                email.current = value;
              }}
              defaultValue={email.current}
              onErrorCheck={(e) => setError(e)}
              returnKeyLabel={strings.next()}
              returnKeyType="next"
              autoComplete="email"
              validationType="email"
              autoCorrect={false}
              autoCapitalize="none"
              errorMessage={strings.emailInvalid()}
              placeholder={strings.email()}
              onSubmit={() => {}}
            />

            <Button
              style={{
                marginTop: 10,
                width: "100%"
              }}
              loading={loading}
              onPress={sendRecoveryEmail}
              type="accent"
              title={loading ? null : strings.next()}
            />
          </View>
        )}
      </ActionSheet>
    </>
  );
};
