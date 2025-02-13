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
import { View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { db } from "../../common/database/index";
import useTimer from "../../hooks/use-timer";
import {
  eSendEvent,
  presentSheet,
  ToastManager
} from "../../services/event-manager";
import { eCloseSheet } from "../../utils/events";
import { AppFontSize } from "../../utils/size";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

const TwoFactorVerification = ({ onMfaLogin, mfaInfo, onCancel }) => {
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
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View
        style={{
          alignItems: "center",
          paddingHorizontal: currentMethod.method ? 12 : 0,
          gap: 12
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
          {currentMethod.method ? strings["2fa"]() : strings.select2faMethod()}
        </Heading>
        <Paragraph
          style={{
            width: "80%",
            textAlign: "center"
          }}
        >
          {strings["2faCodeHelpText"][currentMethod.method]?.() ||
            strings.select2faCodeHelpText()}
        </Paragraph>

        {currentMethod.method === "sms" || currentMethod.method === "email" ? (
          <Button
            onPress={onSendCode}
            type={seconds ? "plain" : "transparent"}
            title={
              sending
                ? ""
                : `${
                    seconds
                      ? strings.resend2faCode(seconds)
                      : strings.sendCode()
                  }`
            }
            loading={sending}
            height={30}
          />
        ) : null}

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
              onSubmitEditing={onNext}
              caretHidden
              inputStyle={{
                fontSize: AppFontSize.lg,
                height: 60,
                textAlign: "center",
                letterSpacing: 10,
                width: 250
              }}
              keyboardType={
                currentMethod.method === "recoveryCode" ? "default" : "numeric"
              }
              enablesReturnKeyAutomatically
              containerStyle={{
                height: 60,
                borderWidth: 0,
                width: undefined,
                minWidth: "50%"
              }}
            />

            <Button
              title={loading ? null : strings.next()}
              type="accent"
              width={250}
              loading={loading}
              onPress={onNext}
              style={{
                borderRadius: 100
              }}
            />

            <Button
              title={strings["2faCodeSecondaryMethodText"][
                currentMethod.method
              ]()}
              type="plain"
              onPress={onRequestSecondaryMethod}
              height={30}
            />

            <Button
              title={strings.cancel()}
              type="plain"
              onPress={onCancel}
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
                  <Paragraph size={AppFontSize.md}>{item.title}</Paragraph>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
};

TwoFactorVerification.present = (onMfaLogin, data, onCancel, context) => {
  presentSheet({
    component: () => (
      <TwoFactorVerification
        onMfaLogin={onMfaLogin}
        mfaInfo={data}
        onCancel={onCancel}
      />
    ),
    context: context || "two_factor_verify",
    disableClosing: true
  });
};

export default TwoFactorVerification;
