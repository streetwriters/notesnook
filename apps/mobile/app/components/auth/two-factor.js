import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { db } from "../../common/database/index";
import useTimer from "../../hooks/use-timer";
import {
  eSendEvent,
  presentSheet,
  ToastEvent
} from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import { eCloseProgressDialog } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import { IconButton } from "../ui/icon-button";
import Input from "../ui/input";
import { PressableButton } from "../ui/pressable";
import Seperator from "../ui/seperator";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

const TwoFactorVerification = ({ onMfaLogin, mfaInfo }) => {
  const colors = useThemeStore((state) => state.colors);
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
    recoveryCode: "Enter the 8 digit recovery code to continue logging in"
  };

  const secondaryMethodsText = {
    app: "I don't have access to authenticator app",
    sms: "I don't have access to my phone",
    email: "I don't have access to email",
    recoveryCode: "I don't have recovery codes"
  };

  const onNext = async () => {
    const length = currentMethod.method === "recoveryCode" ? 8 : 6;

    if (!code.current || code.current.length !== length) return;
    console.log(currentMethod.method, code.current);
    setLoading(true);
    inputRef.current?.blur();
    await onMfaLogin(
      {
        method: currentMethod.method,
        code: code.current
      },
      (result) => {
        console.log("result recieved");
        if (result) {
          eSendEvent(eCloseProgressDialog, "two_factor_verify");
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
  }, [currentMethod.method]);

  const onSendCode = async () => {
    if (seconds || sending) return;
    // TODO
    setSending(true);
    try {
      console.log("sending code", currentMethod.method, mfaInfo.token);
      await db.mfa.sendCode(currentMethod.method, mfaInfo.token);
      start(60);
      setSending(false);
    } catch (e) {
      setSending(false);
      ToastEvent.error(e, "Error sending 2FA Code", "local");
    }
  };

  return (
    <View>
      <View
        style={{
          alignItems: "center",
          paddingHorizontal: currentMethod.method ? 12 : 0
        }}
      >
        <IconButton
          customStyle={{
            width: 70,
            height: 70
          }}
          size={50}
          name="key"
          color={colors.accent}
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
            type={seconds ? "gray" : "transparent"}
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
                currentMethod.method === "recoveryCode" ? "xxxxxxxx" : "xxxxxx"
              }
              maxLength={currentMethod.method === "recoveryCode" ? 8 : 6}
              fwdRef={inputRef}
              textAlign="center"
              onChangeText={(value) => {
                code.current = value;
                onNext();
              }}
              //@ts-ignore
              inputStyle={{
                fontSize: SIZE.lg,
                height: 60,
                textAlign: "center",
                letterSpacing: 10,
                width: null
              }}
              keyboardType={
                currentMethod.method === "recoveryCode" ? "default" : "numeric"
              }
              containerStyle={{
                height: 60,
                borderWidth: 0,
                //@ts-ignore
                width: null,
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
              type="gray"
              onPress={onRequestSecondaryMethod}
              height={30}
            />
          </>
        ) : (
          <>
            {getMethods().map((item) => (
              <PressableButton
                key={item.title}
                onPress={() => {
                  setCurrentMethod({
                    method: item.id,
                    isPrimary: false
                  });
                }}
                customStyle={{
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
                  type="grayAccent"
                  customStyle={{
                    width: 40,
                    height: 40,
                    marginRight: 10
                  }}
                  size={15}
                  color={colors.accent}
                  name={item.icon}
                />
                <View
                  style={{
                    flexShrink: 1
                  }}
                >
                  <Paragraph size={SIZE.md}>{item.title}</Paragraph>
                </View>
              </PressableButton>
            ))}
          </>
        )}
      </View>
    </View>
  );
};

TwoFactorVerification.present = (onMfaLogin, data, context) => {
  console.log("presenting sheet");
  presentSheet({
    component: <TwoFactorVerification onMfaLogin={onMfaLogin} mfaInfo={data} />,
    context: context || "two_factor_verify",
    onClose: () => {
      console.log("on close called");
      onMfaLogin();
    },
    disableClosing: true
  });
};

export default TwoFactorVerification;
