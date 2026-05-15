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
import { TextInput, View } from "react-native";
import { db } from "../../common/database";
import { DDS } from "../../services/device-detection";
import { ToastManager } from "../../services/event-manager";
import SettingsService from "../../services/settings";
import { useThemeColors } from "@notesnook/theme";
import DialogHeader from "../dialog/dialog-header";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import FormInput, { createFormRef, validators } from "../ui/input/form-input";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { strings } from "@notesnook/intl";
import { DefaultAppStyles } from "../../utils/styles";

export const ForgotPassword = ({ userEmail }: { userEmail: string }) => {
  const { colors } = useThemeColors("sheet");
  const formRef = useRef(
    createFormRef({
      email: userEmail || ""
    })
  );
  const emailInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendRecoveryEmail = async () => {
    if (formRef.current.validateField("email")) {
      return;
    }

    const values = formRef.current.getValues();

    setLoading(true);
    try {
      const lastRecoveryEmailTime = SettingsService.get().lastRecoveryEmailTime;
      if (
        lastRecoveryEmailTime &&
        Date.now() - lastRecoveryEmailTime < 60000 * 3
      ) {
        throw new Error(strings.pleaseWaitBeforeSendEmail());
      }
      await db.user.recoverAccount(values.email.toLowerCase());
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
      formRef.current.setError("email", (e as Error).message);
    }
  };

  return (
    <>
      {sent ? (
        <View
          style={{
            padding: DefaultAppStyles.GAP,
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
            padding: DefaultAppStyles.GAP
          }}
        >
          <DialogHeader title={strings.accountRecovery()} />
          <Seperator />

          <FormInput
            name="email"
            formRef={formRef}
            fwdRef={emailInputRef}
            loading={loading}
            returnKeyLabel={strings.next()}
            returnKeyType="next"
            autoComplete="email"
            keyboardType="email-address"
            autoCorrect={false}
            autoCapitalize="none"
            placeholder={strings.email()}
            validators={[
              validators.required(strings.emailRequired()),
              validators.email(strings.enterAValidEmailAddress())
            ]}
            onSubmitEditing={() => {
              sendRecoveryEmail();
            }}
          />

          <Button
            style={{
              marginTop: DefaultAppStyles.GAP_VERTICAL,
              width: "100%"
            }}
            loading={loading}
            onPress={sendRecoveryEmail}
            type="accent"
            title={loading ? null : strings.next()}
          />
        </View>
      )}
    </>
  );
};
