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
import { Radius, Spacing } from "../../common/design/spacing";
import useTimer from "../../hooks/use-timer";
import { ToastManager } from "../../services/event-manager";
import { hexToRGBA, RGB_Linear_Shade } from "../../utils/colors";
import { AppFontSize } from "../../utils/size";
import { presentDialog } from "../dialog/functions";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import PinInput from "../ui/pin-input/index";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

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
    callback: (result: any) => void
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
  const { seconds, start, reset } = useTimer(currentMethod.method!);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [sending, setSending] = useState(false);
  const [codeInput, setCodeInput] = useState("");

  const isRecoveryCode = currentMethod.method === "recoveryCode";
  const codeLength = isRecoveryCode ? 10 : 6;

  const onNext = async () => {
    if (!code.current || code.current.length < 6 || !currentMethod.method)
      return;
    setLoading(true);
    inputRef.current?.blur();
    await onMfaLogin(
      {
        method: currentMethod.method,
        code: code.current
      },
      () => {
        setLoading(false);
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
      icon: "chat",
      iconFamily: "notesnook"
    },
    {
      id: "email",
      title: strings.sendCodeEmail(),
      icon: "envelope-simple",
      iconFamily: "notesnook"
    },
    {
      id: "app",
      title: strings.authAppCode(),
      icon: "cellphone-key"
    },
    {
      id: "recoveryCode",
      title: strings.recoveryCode(),
      icon: "lock-simple",
      iconFamily: "notesnook"
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
    if (seconds || sending) return;
    setSending(true);
    try {
      await db.mfa.sendCode(currentMethod.method as "sms" | "email");
      start(60);
      setSending(false);
    } catch (e) {
      setSending(false);
      ToastManager.error(e as Error, "Error sending 2FA Code", "local");
    }
  }, [currentMethod.method, mfaInfo.token, seconds, sending, start]);

  useEffect(() => {
    if (currentMethod.method === "sms" || currentMethod.method === "email") {
      onSendCode();
    }
  }, [currentMethod.method, onSendCode]);

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
        alignItems: "center",
        gap: Spacing.LEVEL_3
      }}
    >
      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3,
          width: "100%"
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
          iconFamily="notesnook"
          name="shield-check"
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
            textAlign: "center"
          }}
        >
          {currentMethod.method
            ? strings["2faCodeHelpText"][
                currentMethod.method as keyof (typeof strings)["2faCodeHelpText"]
              ]?.() || strings.select2faCodeHelpText()
            : strings.select2faCodeHelpText()}
        </Paragraph>
      </View>

      {currentMethod.method ? (
        <>
          <View
            style={{
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
                type={"plain"}
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
                fontFamily="REGULAR"
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
        <View
          style={{
            gap: Spacing.LEVEL_2,
            width: "100%"
          }}
        >
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
                padding: Spacing.LEVEL_2,
                backgroundColor: colors.secondary.background,
                flexDirection: "row",
                borderRadius: Radius.S,
                alignItems: "center",
                width: "100%",
                justifyContent: "flex-start",
                gap: Spacing.LEVEL_1
              }}
            >
              <IconButton
                style={{
                  borderRadius: Radius.XS,
                  padding: Spacing.LEVEL_1,
                  width: undefined,
                  height: undefined,
                  backgroundColor: RGB_Linear_Shade(
                    0.04,
                    hexToRGBA(colors.secondary.background)
                  )
                }}
                size={17}
                color={colors.primary.icon}
                name={item.icon}
                iconFamily={item.iconFamily as "notesnook"}
              />
              <View
                style={{
                  flexShrink: 1
                }}
              >
                <Paragraph size={AppFontSize.sm}>{item.title}</Paragraph>
              </View>
            </Pressable>
          ))}
        </View>
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
    callback: (result: any) => void
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
