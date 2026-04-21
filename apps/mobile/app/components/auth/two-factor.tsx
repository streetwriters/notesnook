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
import { db } from "../../common/database/index";
import useTimer from "../../hooks/use-timer";
import { eSendEvent, ToastManager } from "../../services/event-manager";
import { eCloseSimpleDialog } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { presentDialog } from "../dialog/functions";
import AppIcon from "../ui/AppIcon";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import PinInput from "../ui/pin-input/index";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { Radius, Spacing } from "../../common/design/spacing";

type MFAInfo = {
  primaryMethod: string;
  secondaryMethod: string;
  token: string;
};

const TwoFactorVerification = ({
  onMfaLogin,
  mfaInfo,
  onCancel
}: {
  onMfaLogin: (
    login: {
      method: string;
      code: string;
    },
    callback: (result: any) => void,
    onerror: (e: Error) => void
  ) => Promise<void>;
  mfaInfo: MFAInfo;
  onCancel: () => void;
}) => {
  const { colors } = useThemeColors();
  const code = useRef<string>(undefined);
  const [currentMethod, setCurrentMethod] = useState<{
    isPrimary: boolean;
    method: string | null;
  }>({
    method: mfaInfo?.primaryMethod,
    isPrimary: true
  });
  const { seconds, start, reset, secondsRef } = useTimer(currentMethod.method!);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [codeInput, setCodeInput] = useState("");

  const isRecoveryCode = currentMethod.method === "recoveryCode";
  const codeLength = isRecoveryCode ? 10 : 6;

  const onNext = async () => {
    if (!code.current || code.current.length < 6) {
      setError(
        new Error("Please provide a valid multi-factor authentication code.")
      );
      return;
    }

    if (!currentMethod.method) {
      return;
    }

    setLoading(true);
    setError(undefined);
    inputRef.current?.blur();
    await onMfaLogin(
      {
        method: currentMethod.method,
        code: code.current
      },
      () => {
        setLoading(false);
      },
      (e) => {
        setError(e);
      }
    );
    setLoading(false);
  };

  const onRequestSecondaryMethod = () => {
    setCurrentMethod({
      method: null,
      isPrimary: false
    });
  };

  const methods = [
    {
      id: "sms",
      title: strings.sendCodeSms(),
      icon: "message-plus-outline"
    },
    {
      id: "email",
      title: strings.sendCodeEmail(),
      icon: "email-outline"
    },
    {
      id: "app",
      title: strings.authAppCode(),
      icon: "cellphone-key"
    },
    {
      id: "recoveryCode",
      title: strings.recoveryCode(),
      icon: "key"
    }
  ];

  const getMethods = () => {
    return methods.filter(
      (m) =>
        m.id === mfaInfo?.primaryMethod ||
        m.id === mfaInfo?.secondaryMethod ||
        m.id === "recoveryCode"
    );
  };

  const onSendCode = useCallback(async () => {
    if (secondsRef.current || sending) return;
    setSending(true);
    try {
      await db.mfa.sendCode(currentMethod.method as "sms" | "email");
      start(60);
      setSending(false);
    } catch (e) {
      setSending(false);
      setError(
        new Error(`Error sending 2FA Code. Tap "Send code" to try again `)
      );
    }
  }, [currentMethod.method, secondsRef, sending, start]);

  useEffect(() => {
    if (currentMethod.method === "sms" || currentMethod.method === "email") {
      onSendCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMethod.method]);

  useEffect(() => {
    setCodeInput("");
    code.current = "";
  }, [currentMethod.method]);

  return (
    <View
      onLayout={() => {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 500);
      }}
      style={{
        alignItems: "center"
      }}
    >
      <IconButton
        style={{
          width: 50,
          height: 50,
          backgroundColor: colors.primary.shade,
          borderRadius: Radius.XS,
          marginBottom: Spacing.LEVEL_7
        }}
        size={25}
        name="key"
        color={colors.primary.accent}
      />
      <Heading
        style={{
          textAlign: "center",
          marginBottom: Spacing.LEVEL_1
        }}
      >
        {currentMethod.method ? strings["2fa"]() : strings.select2faMethod()}
      </Heading>
      <Paragraph
        style={{
          width: "80%",
          textAlign: "center"
        }}
      >
        {currentMethod.method
          ? strings["2faCodeHelpText"][
              currentMethod.method as keyof (typeof strings)["2faCodeHelpText"]
            ]?.() || strings.select2faCodeHelpText()
          : strings.select2faCodeHelpText()}
      </Paragraph>

      {currentMethod.method ? (
        <>
          <View
            style={{
              marginTop: Spacing.LEVEL_4,
              borderRadius: Radius.S,
              borderWidth: 1,
              borderColor: colors.primary.border,
              paddingVertical: Spacing.LEVEL_4,
              paddingHorizontal: Spacing.LEVEL_3,
              width: "100%",
              gap: Spacing.LEVEL_4
            }}
          >
            <PinInput
              testID={"input.totp"}
              inputRef={inputRef}
              length={codeLength}
              value={codeInput}
              onChangeText={(value: string) => {
                setCodeInput(value);
                code.current = value;
              }}
              onSubmitEditing={onNext}
              keyboardType={isRecoveryCode ? "default" : "number-pad"}
              sanitize={(value: string) => {
                if (isRecoveryCode) {
                  return value.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
                }

                return value.replace(/[^0-9]/g, "");
              }}
            />
            {error ? (
              <Paragraph
                numberOfLines={4}
                onPress={() => {}}
                color={colors.error.accent}
                style={{
                  textAlign: "center",
                  marginVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
                  maxWidth: 250
                }}
              >
                <AppIcon
                  color={colors.error.accent}
                  name="alert-circle-outline"
                  size={AppFontSize.sm - 1}
                />{" "}
                {error?.message}
              </Paragraph>
            ) : null}

            <View
              style={{
                flexDirection: "row",
                gap: Spacing.LEVEL_2
              }}
            >
              <Button
                title={strings.cancel()}
                type="secondary"
                onPress={() => {
                  reset();
                  onCancel();
                }}
                style={{
                  width: "48%"
                }}
              />
              <Button
                title={loading ? null : strings.continue()}
                type="accent"
                loading={loading}
                onPress={onNext}
                style={{
                  width: "48%"
                }}
              />
            </View>

            {currentMethod.method === "sms" ||
            currentMethod.method === "email" ? (
              <Button
                onPress={onSendCode}
                type={seconds ? "secondary" : "transparent"}
                disabled={!seconds}
                title={
                  sending
                    ? ""
                    : `${
                        seconds
                          ? strings.resend2faCode(`${seconds}`)
                          : strings.resendCode()
                      }`
                }
                loading={sending}
                fontSize={AppFontSize.sm}
                style={{
                  paddingVertical: 0,
                  alignSelf: "flex-start",
                  paddingHorizontal: 0
                }}
              />
            ) : null}
          </View>

          <Button
            title={strings["2faCodeSecondaryMethodText"][
              currentMethod.method as keyof (typeof strings)["2faCodeSecondaryMethodText"]
            ]()}
            type="plain"
            onPress={onRequestSecondaryMethod}
            height={30}
          />
        </>
      ) : (
        <>
          {getMethods().map((item) => (
            <Pressable
              key={item.title}
              onPress={() => {
                setCurrentMethod({
                  method: item.id,
                  isPrimary: false
                });
              }}
              style={{
                paddingHorizontal: DefaultAppStyles.GAP,
                paddingVertical: DefaultAppStyles.GAP_VERTICAL,
                marginTop: 0,
                flexDirection: "row",
                borderRadius: 0,
                alignItems: "center",
                width: "100%",
                justifyContent: "flex-start"
              }}
            >
              <IconButton
                type="secondaryAccented"
                style={{
                  marginRight: 10
                }}
                size={15}
                color={colors.primary.accent}
                name={item.icon}
              />
              <View
                style={{
                  flexShrink: 1
                }}
              >
                <Paragraph size={AppFontSize.md}>{item.title}</Paragraph>
              </View>
            </Pressable>
          ))}
        </>
      )}
    </View>
  );
};

TwoFactorVerification.present = (
  onMfaLogin: (
    login: {
      method: string;
      code: string;
    },
    callback: (result: any) => void,
    onerror: (e: Error) => void
  ) => Promise<void>,
  data: MFAInfo,
  onCancel: () => void,
  context?: string
) => {
  presentDialog({
    component: () => (
      <TwoFactorVerification
        onMfaLogin={onMfaLogin}
        mfaInfo={data}
        onCancel={onCancel}
      />
    ),
    context: context || "two_factor_verify",
    transparent: false,
    statusBarTranslucent: true
  });
};

export default TwoFactorVerification;
