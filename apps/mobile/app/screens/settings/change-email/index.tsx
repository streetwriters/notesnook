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
import { db } from "../../../common/database";
import { eSendEvent, ToastManager } from "../../../services/event-manager";
import { eUserLoggedIn } from "../../../utils/events";
import { strings } from "@notesnook/intl";
import { DefaultAppStyles } from "../../../utils/styles";
import Input from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

enum EmailChangeSteps {
  verify,
  changeEmail
}

export const ChangeEmail = () => {
  const [step, setStep] = useState(EmailChangeSteps.verify);
  const emailChangeData = useRef<{
    email?: string;
    password?: string;
    code?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const emailInputRef = useRef<TextInput>(null);
  const passInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  const onSubmit = async () => {
    try {
      if (step === EmailChangeSteps.verify) {
        if (
          !emailChangeData.current.email ||
          !emailChangeData.current.password ||
          error
        )
          return;
        setLoading(true);
        const verified = await db.user?.verifyPassword(
          emailChangeData.current.password
        );
        if (!verified) throw new Error(strings.passwordIncorrect());
        await db.user?.sendVerificationEmail(emailChangeData.current.email);
        setStep(EmailChangeSteps.changeEmail);
        setLoading(false);
      } else {
        if (
          !emailChangeData.current.email ||
          !emailChangeData.current.password ||
          error ||
          !emailChangeData.current.code
        )
          return;
        await db.user?.changeEmail(
          emailChangeData.current.email,
          emailChangeData.current.password,
          emailChangeData.current.code
        );
        eSendEvent(eUserLoggedIn);
        close?.();
        ToastManager.show({
          heading: strings.emailUpdated(emailChangeData.current.email),
          type: "success",
          context: "global"
        });
      }
    } catch (e) {
      setLoading(false);
      ToastManager.error(e as Error);
    }
  };

  return (
    <View style={{ paddingHorizontal: DefaultAppStyles.GAP }}>
      <View
        style={{
          marginTop: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        {step === EmailChangeSteps.verify ? (
          <>
            <Input
              fwdRef={emailInputRef}
              placeholder={strings.enterNewEmail()}
              validationType="email"
              onErrorCheck={(e) => setError(e)}
              onChangeText={(email) => {
                emailChangeData.current.email = email;
              }}
            />
            <Input
              fwdRef={passInputRef}
              placeholder={strings.enterAccountPassword()}
              secureTextEntry
              onChangeText={(pass) => {
                emailChangeData.current.password = pass;
              }}
            />
          </>
        ) : (
          <>
            <Input
              key="code-input"
              fwdRef={codeInputRef}
              placeholder={strings.code()}
              defaultValue=""
              onChangeText={(code) => {
                emailChangeData.current.code = code;
              }}
            />
          </>
        )}
      </View>

      <Button
        title={
          loading
            ? undefined
            : step === EmailChangeSteps.verify
            ? strings.verify()
            : strings.changeEmail()
        }
        type="accent"
        style={{
          width: "100%"
        }}
        loading={loading}
        onPress={onSubmit}
      />
    </View>
  );
};
