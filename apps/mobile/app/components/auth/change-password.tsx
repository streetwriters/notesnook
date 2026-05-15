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

import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useRef, useState } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import BackupService from "../../services/backup";
import { eSendEvent, ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useUserStore } from "../../stores/use-user-store";
import { eOpenRecoveryKeyDialog } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Dialog } from "../dialog";
import AppIcon from "../ui/AppIcon";
import { Button } from "../ui/button";
import FormInput, { createFormRef, validators } from "../ui/input/form-input";
import { Notice } from "../ui/notice";
import Paragraph from "../ui/typography/paragraph";
import { TextInput } from "react-native-gesture-handler";

export const ChangePassword = () => {
  const { colors } = useThemeColors();
  const formRef = useRef(
    createFormRef({
      oldPassword: "",
      password: ""
    })
  );
  const oldPasswordInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const user = useUserStore((state) => state.user);

  const changePassword = async () => {
    setError(undefined);
    formRef.current.clearErrors();

    if (!user?.isEmailConfirmed) {
      setError(strings.emailNotConfirmedDesc());
      return;
    }
    if (!formRef.current.validate()) {
      return;
    }

    const values = formRef.current.getValues();

    setLoading(true);
    try {
      const result = await BackupService.run(
        false,
        "change-password-dialog",
        "partial"
      );
      if (result.error) {
        throw new Error(strings.backupFailed() + `: ${result.error}`);
      }

      const passwordChanged = await db.user.changePassword(
        values.oldPassword,
        values.password
      );

      if (!passwordChanged) {
        throw new Error("Could not change user account password.");
      }

      ToastManager.show({
        heading: strings.passwordChangedSuccessfully(),
        type: "success",
        context: "global"
      });
      setLoading(false);
      Navigation.goBack();
      eSendEvent(eOpenRecoveryKeyDialog);
    } catch (e) {
      const message = (e as Error).message;
      setLoading(false);

      if (/old password/i.test(message)) {
        formRef.current.setError("oldPassword", message);
      } else {
        setError(message);
      }
    }
  };

  return (
    <View
      style={{
        width: "100%",
        padding: DefaultAppStyles.GAP
      }}
    >
      <Dialog context="change-password-dialog" />
      <FormInput
        name="oldPassword"
        formRef={formRef}
        fwdRef={oldPasswordInputRef}
        loading={loading}
        validators={[validators.required(strings.currentPasswordRequired())]}
        returnKeyLabel="Next"
        returnKeyType="next"
        secureTextEntry
        autoComplete="password"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={strings.currentPassword()}
        onSubmitEditing={() => {
          passwordInputRef.current?.focus();
        }}
      />

      <FormInput
        name="password"
        formRef={formRef}
        fwdRef={passwordInputRef}
        loading={loading}
        validators={[validators.required(strings.passwordRequired())]}
        returnKeyLabel={strings.next()}
        returnKeyType="next"
        secureTextEntry
        autoComplete="password"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={strings.newPassword()}
        onSubmitEditing={() => {
          changePassword();
        }}
      />

      {error ? (
        <Paragraph
          numberOfLines={4}
          onPress={() => {}}
          color={colors.error.accent}
          style={{
            textAlign: "center",
            marginTop: DefaultAppStyles.GAP_VERTICAL
          }}
        >
          <AppIcon
            color={colors.error.accent}
            name="alert-circle-outline"
            size={AppFontSize.sm - 1}
          />{" "}
          {error}
        </Paragraph>
      ) : null}

      <Notice text={strings.changePasswordNotice()} type="alert" />

      <View style={{ height: 10 }} />

      <Notice text={strings.changePasswordNotice2()} type="alert" />

      <Button
        style={{
          marginTop: DefaultAppStyles.GAP_VERTICAL,
          width: "100%"
        }}
        loading={loading}
        onPress={changePassword}
        type="accent"
        title={loading ? null : strings.changePasswordConfirm()}
      />
    </View>
  );
};
