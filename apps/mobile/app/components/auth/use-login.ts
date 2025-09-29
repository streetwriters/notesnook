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
import { useRef, useState } from "react";
import { TextInput } from "react-native";
import { db } from "../../common/database";
import { ToastManager, eSendEvent } from "../../services/event-manager";
import { clearMessage } from "../../services/message";
import PremiumService from "../../services/premium";
import SettingsService from "../../services/settings";
import { useUserStore } from "../../stores/use-user-store";
import { eCloseSimpleDialog } from "../../utils/events";
import TwoFactorVerification from "./two-factor";

export const LoginSteps = {
  emailAuth: 1,
  mfaAuth: 2,
  passwordAuth: 3
};

export const useLogin = (
  onFinishLogin?: () => void,
  sessionExpired = false
) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const [step, setStep] = useState(LoginSteps.emailAuth);
  const email = useRef<string>();
  const password = useRef<string>();
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const validateInfo = () => {
    if (
      (!password.current && step === LoginSteps.passwordAuth) ||
      (!email.current && step === LoginSteps.emailAuth)
    ) {
      ToastManager.show({
        heading: strings.allFieldsRequired(),
        message: strings.allFieldsRequiredDesc(),
        type: "error",
        context: "local"
      });

      return false;
    }

    return true;
  };

  const login = async () => {
    if (!validateInfo() || error) return;
    try {
      if (loading) return;
      setLoading(true);
      switch (step) {
        case LoginSteps.emailAuth: {
          if (!email.current) {
            setLoading(false);
            return;
          }
          const mfaInfo = await db.user.authenticateEmail(email.current);

          if (mfaInfo) {
            TwoFactorVerification.present(
              async (mfa: any, callback: (success: boolean) => void) => {
                try {
                  const success = await db.user.authenticateMultiFactorCode(
                    mfa.code,
                    mfa.method
                  );

                  if (success) {
                    setStep(LoginSteps.passwordAuth);
                    setLoading(false);
                    setTimeout(() => {
                      passwordInputRef.current?.focus();
                    }, 500);
                    callback && callback(true);
                  }
                  callback && callback(false);
                } catch (e) {
                  callback && callback(false);
                  if (e.message === "invalid_grant") {
                    eSendEvent(eCloseSimpleDialog, "two_factor_verify");
                    setLoading(false);
                    setStep(LoginSteps.emailAuth);
                  }
                }
              },
              mfaInfo,
              () => {
                eSendEvent(eCloseSimpleDialog, "two_factor_verify");
                setLoading(false);
                setStep(LoginSteps.emailAuth);
              }
            );
          } else {
            finishWithError(new Error(strings.unableToSend2faCode()));
          }
          break;
        }
        case LoginSteps.passwordAuth: {
          if (!email.current || !password.current) {
            setLoading(false);
            return;
          }
          await db.user.authenticatePassword(
            email.current,
            password.current,
            undefined,
            sessionExpired
          );
          finishLogin();
          break;
        }
      }
      setLoading(false);
    } catch (e) {
      finishWithError(e as Error);
    }
  };

  const finishWithError = async (e: Error) => {
    if (e.message === "invalid_grant") setStep(LoginSteps.emailAuth);
    setLoading(false);
    ToastManager.show({
      heading: strings.loginFailed(),
      message: e.message,
      type: "error",
      context: "local"
    });
  };

  const finishLogin = async () => {
    const user = await db.user.getUser();
    if (!user) throw new Error(strings.emailOrPasswordIncorrect());
    PremiumService.setPremiumStatus();
    setUser(user);
    clearMessage();
    ToastManager.show({
      heading: strings.loginSuccess(),
      message: strings.loginSuccessDesc(user.email),
      type: "success",
      context: "global"
    });
    SettingsService.set({
      sessionExpired: false,
      userEmailConfirmed: user?.isEmailConfirmed
    });
    onFinishLogin?.();
    setLoading(false);
  };

  return {
    login,
    step,
    setStep,
    email,
    password,
    passwordInputRef,
    emailInputRef,
    loading,
    setLoading,
    error,
    setError
  };
};
