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
import React, { useRef, useState } from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import BackupService from "../../services/backup";
import { eSendEvent, ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useUserStore } from "../../stores/use-user-store";
import { eOpenRecoveryKeyDialog } from "../../utils/events";
import { DefaultAppStyles } from "../../utils/styles";
import { Dialog } from "../dialog";
import { Button } from "../ui/button";
import Input from "../ui/input";
import { Notice } from "../ui/notice";

export const ChangePassword = () => {
  const passwordInputRef = useRef();
  const password = useRef();
  const oldPasswordInputRef = useRef();
  const oldPassword = useRef();

  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = useUserStore((state) => state.user);

  const changePassword = async () => {
    if (!user?.isEmailConfirmed) {
      ToastManager.show({
        heading: strings.emailNotConfirmed(),
        message: strings.emailNotConfirmedDesc(),
        type: "error",
        context: "local"
      });
      return;
    }
    if (error || !oldPassword.current || !password.current) {
      ToastManager.show({
        heading: strings.allFieldsRequired(),
        message: strings.allFieldsRequiredDesc(),
        type: "error",
        context: "local"
      });
      return;
    }
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

      await db.user.changePassword(oldPassword.current, password.current);
      ToastManager.show({
        heading: strings.passwordChangedSuccessfully(),
        type: "success",
        context: "global"
      });
      setLoading(false);
      Navigation.goBack();
      eSendEvent(eOpenRecoveryKeyDialog);
    } catch (e) {
      setLoading(false);
      ToastManager.show({
        heading: strings.passwordChangeFailed(),
        message: e.message,
        type: "error",
        context: "local"
      });
    }
    setLoading(false);
  };

  return (
    <View
      style={{
        width: "100%",
        padding: DefaultAppStyles.GAP
      }}
    >
      <Dialog context="change-password-dialog" />
      <Input
        fwdRef={oldPasswordInputRef}
        onChangeText={(value) => {
          oldPassword.current = value;
        }}
        returnKeyLabel="Next"
        returnKeyType="next"
        secureTextEntry
        autoComplete="password"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={strings.oldPassword()}
      />

      <Input
        fwdRef={passwordInputRef}
        onChangeText={(value) => {
          password.current = value;
        }}
        onErrorCheck={(e) => setError(e)}
        returnKeyLabel={strings.next()}
        returnKeyType="next"
        secureTextEntry
        validationType="password"
        autoComplete="password"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder={strings.newPassword()}
      />

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
