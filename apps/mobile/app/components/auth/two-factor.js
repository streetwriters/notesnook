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

import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { db } from "../../common/database/index";
import useTimer from "../../hooks/use-timer";
import {
  eSendEvent,
  presentSheet,
  ToastManager
} from "../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { eCloseSheet } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import { Pressable } from "../ui/pressable";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { useCallback } from "react";

const TwoFactorVerification = ({ onMfaLogin, mfaInfo }) => {
  const { colors } = useThemeColors();
  const code = useRef();
  const [currentMethod, setCurrentMethod] = useState({
    method: mfaInfo?.primaryMethod,
    isPrimary: true
  });
  const { seconds, start } = useTimer(currentMethod.method);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const [sending, setSending] = useState(false);

  const codeHelpText = {
    app: "Enter the 6 digit code from your authenticator app to continue logging in",
    sms: "Enter the 6 digit code sent to your phone number to continue logging in",
    email: "Enter the 6 digit code sent to your email to continue logging in",
    recoveryCode: "Enter the recovery code to continue logging in"
  };

  const secondaryMethodsText = {
    app: "I don't have access to authenticator app",
    sms: "I don't have access to my phone",
    email: "I don't have access to email",
    recoveryCode: "I don't have recovery codes"
  };

  const onNext = async () => {
    if (!code.current || code.current.length < 6) return;
    setLoading(true);
    inputRef.current?.blur();
    await onMfaLogin(
      {
        method: currentMethod.method,
        code: code.current
      },
      (result) => {
        if (result) {
          eSendEvent(eCloseSheet, "two_factor_verify");
        }
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
      title: "Send code via SMS",
      icon: "message-plus-outline"
    },
    {
      id: "email",
      title: "Send code via email",
      icon: "email-outline"
    },
    {
      id: "app",
      title: "Enter code from authenticator app",
      icon: "cellphone-key"
    },
    {
      id: "recoveryCode",
      title: "I have a recovery code",
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

  useEffect(() => {
    if (currentMethod.method === "sms" || currentMethod.method === "email") {
      onSendCode();
    }
  }, [currentMethod.method, onSendCode]);

  const onSendCode = useCallback(async () => {
    if (seconds || sending) return;
    // TODO
    setSending(true);
    try {
      await db.mfa.sendCode(currentMethod.method, mfaInfo.token);
      start(60);
      setSending(false);
    } catch (e) {
      setSending(false);
      ToastManager.error(e, "Error sending 2FA Code", "local");
    }
  }, [currentMethod.method, mfaInfo.token, seconds, sending, start]);

  return (
    <View>
      <View
        style={{
          alignItems: "center",
          paddingHorizontal: currentMethod.method ? 12 : 0
        }}
      >
        <IconButton
          style={{
            width: 70,
            height: 70
          }}
          size={50}
          name="key"
          color={colors.primary.accent}
        />
        <Heading
          style={{
            textAlign: "center"
          }}
        >
          {currentMethod.method
            ? "Two factor authentication"
            : "Select methods for two-factor authentication"}
        </Heading>
        <Paragraph
          style={{
            width: "80%",
            textAlign: "center"
          }}
        >
          {codeHelpText[currentMethod.method] ||
            "Select how you would like to recieve the code"}
        </Paragraph>

        <Seperator />

        {currentMethod.method === "sms" || currentMethod.method === "email" ? (
          <Button
            onPress={onSendCode}
            type={seconds ? "plain" : "transparent"}
            title={
              sending
                ? ""
                : `${seconds ? `Resend code in (${seconds})` : "Send code"}`
            }
            loading={sending}
            height={30}
          />
        ) : null}

        <Seperator />

        {currentMethod.method ? (
          <>
            <Input
              placeholder={
                currentMethod.method === "recoveryCode"
                  ? "xxxxx-xxxxx"
                  : "xxxxxx"
              }
              testID={"input.totp"}
              maxLength={
                currentMethod.method === "recoveryCode" ? undefined : 6
              }
              fwdRef={inputRef}
              textAlign="center"
              onChangeText={(value) => {
                code.current = value;
                //onNext();
              }}
              caretHidden
              inputStyle={{
                fontSize: SIZE.lg,
                height: 60,
                textAlign: "center",
                letterSpacing: 10,
                width: 250
              }}
              keyboardType={
                currentMethod.method === "recoveryCode" ? "default" : "numeric"
              }
              containerStyle={{
                height: 60,
                borderWidth: 0,
                width: undefined,
                minWidth: "50%"
              }}
            />
            <Seperator />
            <Button
              title={loading ? null : "Next"}
              type="accent"
              width={250}
              loading={loading}
              onPress={onNext}
              style={{
                borderRadius: 100,
                marginBottom: 10
              }}
            />

            <Button
              title={secondaryMethodsText[currentMethod.method]}
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
                  paddingHorizontal: 12,
                  paddingVertical: 12,
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
                    width: 40,
                    height: 40,
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
                  <Paragraph size={SIZE.md}>{item.title}</Paragraph>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </View>
    </View>
  );
};

TwoFactorVerification.present = (onMfaLogin, data, context) => {
  presentSheet({
    component: () => (
      <TwoFactorVerification onMfaLogin={onMfaLogin} mfaInfo={data} />
    ),
    context: context || "two_factor_verify",
    onClose: () => {
      onMfaLogin();
    },
    disableClosing: true
  });
};

export default TwoFactorVerification;
