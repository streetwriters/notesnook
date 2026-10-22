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
import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { db } from "../../../common/database";
import { Spacing } from "../../../common/design/spacing";
import { Button } from "../../../components/ui/button";
import FormInput, {
  createFormRef,
  validators
} from "../../../components/ui/input/form-input";
import Heading from "../../../components/ui/typography/heading";
import Paragraph from "../../../components/ui/typography/paragraph";
import { eSendEvent, ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { eUserLoggedIn } from "../../../utils/events";

enum EmailChangeSteps {
  verify,
  changeEmail
}

const RESEND_TIMEOUT = 30;

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
  const [resendSeconds, setResendSeconds] = useState(RESEND_TIMEOUT);
  const emailInputRef = useRef<TextInput>(null);
  const passInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (step !== EmailChangeSteps.changeEmail || resendSeconds <= 0) return;
    const timer = setTimeout(() => {
      setResendSeconds((seconds) => seconds - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [step, resendSeconds]);

  const onResend = useCallback(async () => {
    if (resendSeconds > 0) return;
    try {
      const { email } = formRef.current.getValues();
      await db.user?.sendVerificationEmail(email);
      setResendSeconds(RESEND_TIMEOUT);
    } catch (e) {
      formRef.current.setError("code", (e as Error).message);
    }
  }, [resendSeconds]);

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
        setResendSeconds(RESEND_TIMEOUT);
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
    <View
      style={{
        paddingHorizontal: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_4,
        gap: Spacing.LEVEL_4
      }}
    >
      {step === EmailChangeSteps.verify ? (
        <View
          style={{
            gap: Spacing.LEVEL_2
          }}
        >
          <FormInput
            name="email"
            formRef={formRef}
            label={strings.enterNewEmail()}
            fwdRef={emailInputRef}
            placeholder={strings.enterEmail()}
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
            label={strings.enterAccountPassword()}
            formRef={formRef}
            fwdRef={passInputRef}
            placeholder={strings.password()}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            validators={[validators.required(strings.passwordRequired())]}
            onSubmitEditing={onSubmit}
          />
        </View>
      ) : (
        <View
          style={{
            gap: Spacing.LEVEL_4
          }}
        >
          <View
            style={{
              gap: Spacing.LEVEL_1
            }}
          >
            <Heading fontSize="MD" lineHeight="100%">
              {strings.verifyCurrentEmail()}
            </Heading>
            <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
              {strings.verifyCurrentEmailDesc()}
            </Paragraph>
          </View>
          <FormInput
            name="code"
            formRef={formRef}
            label={strings.enterCode()}
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
          <Paragraph
            fontSize="SM"
            onPress={onResend}
            style={{
              marginTop: -Spacing.LEVEL_1
            }}
            color={
              resendSeconds > 0
                ? colors.secondary.paragraph
                : colors.primary.accent
            }
          >
            {resendSeconds > 0
              ? strings.resend2faCode(`${resendSeconds}`)
              : strings.resendCode()}
          </Paragraph>
        </View>
      )}

      <Button
        title={
          loading
            ? undefined
            : step === EmailChangeSteps.verify
              ? strings.continue()
              : strings.verify()
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
