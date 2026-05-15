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
import { TextInput, View } from "react-native";
import { db } from "../../../common/database";
import { Button } from "../../../components/ui/button";
import FormInput, {
  createFormRef,
  validators
} from "../../../components/ui/input/form-input";
import { eSendEvent, ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { eUserLoggedIn } from "../../../utils/events";
import { DefaultAppStyles } from "../../../utils/styles";

enum EmailChangeSteps {
  verify,
  changeEmail
}

export const ChangeEmail = () => {
  const { colors } = useThemeColors();
  const [step, setStep] = useState(EmailChangeSteps.verify);
  const formRef = useRef(
    createFormRef({
      email: "",
      password: "",
      code: ""
    })
  );
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef<TextInput>(null);
  const passInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  const onSubmit = async () => {
    try {
      if (step === EmailChangeSteps.verify) {
        const hasEmailError = formRef.current.validateField("email");
        const hasPasswordError = formRef.current.validateField("password");
        if (hasEmailError || hasPasswordError) return;

        const { email, password } = formRef.current.getValues();

        setLoading(true);
        const verified = await db.user?.verifyPassword(password);
        if (!verified) throw new Error(strings.passwordIncorrect());
        await db.user?.sendVerificationEmail(email);
        setStep(EmailChangeSteps.changeEmail);
        formRef.current.clearErrors();
        formRef.current.setValue("code", "");
        setLoading(false);
      } else {
        const hasCodeError = formRef.current.validateField("code");
        if (hasCodeError) return;

        const { email, password, code } = formRef.current.getValues();

        setLoading(true);
        await db.user?.changeEmail(email, password, code);
        eSendEvent(eUserLoggedIn);
        ToastManager.show({
          heading: strings.emailUpdated(email),
          type: "success",
          context: "global"
        });
        Navigation.goBack();
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
      const error = e as Error;

      if (step === EmailChangeSteps.verify) {
        if (error.message === strings.passwordIncorrect()) {
          formRef.current.setError("password", error.message);
        } else {
          formRef.current.setError("email", error.message);
        }
        return;
      } else {
        formRef.current.setError("code", error.message);
        return;
      }
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
            <FormInput
              name="email"
              formRef={formRef}
              fwdRef={emailInputRef}
              placeholder={strings.enterNewEmail()}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              validators={[
                validators.required(strings.emailRequired()),
                validators.email(strings.enterValidEmail())
              ]}
              onSubmitEditing={() => {
                passInputRef.current?.focus();
              }}
            />
            <FormInput
              name="password"
              formRef={formRef}
              fwdRef={passInputRef}
              placeholder={strings.enterAccountPassword()}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              validators={[validators.required(strings.passwordRequired())]}
              onSubmitEditing={onSubmit}
            />
          </>
        ) : (
          <>
            <FormInput
              name="code"
              formRef={formRef}
              fwdRef={codeInputRef}
              placeholder={strings.code()}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={6}
              validators={[
                validators.required(strings.enterSixDigitCode()),
                (value: string) =>
                  /^\d{6}$/.test(value.trim())
                    ? undefined
                    : strings.enterSixDigitCode()
              ]}
              onSubmitEditing={onSubmit}
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
