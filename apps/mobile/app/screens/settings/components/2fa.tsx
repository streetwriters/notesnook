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

import { sanitizeFilename, useIsFeatureAvailable } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  TextInput,
  View
} from "react-native";
import RNFetchBlob from "react-native-blob-util";
import * as ScopedStorage from "react-native-scoped-storage";
import isMobilePhone from "validator/lib/isMobilePhone";
import { db } from "../../../common/database";
import { Radius, Spacing } from "../../../common/design/spacing";
import filesystem from "../../../common/filesystem";
import DialogHeader from "../../../components/dialog/dialog-header";
import PaywallSheet from "../../../components/sheets/paywall";
import AppIcon from "../../../components/ui/AppIcon";
import { Button } from "../../../components/ui/button";
import FormInput, {
  createFormRef,
  validators
} from "../../../components/ui/input/form-input";
import PinInput from "../../../components/ui/pin-input";
import { Pressable } from "../../../components/ui/pressable";
import LineSeparator from "../../../components/ui/seperator/line-separator";
import Heading from "../../../components/ui/typography/heading";
import Paragraph from "../../../components/ui/typography/paragraph";
import useTimer from "../../../hooks/use-timer";
import {
  eSendEvent,
  presentSheet,
  ToastManager
} from "../../../services/event-manager";
import { useUserStore } from "../../../stores/use-user-store";
import { eCloseSheet } from "../../../utils/events";
import { AppFontSize } from "../../../utils/size";
import { sleep } from "../../../utils/time";
const mfaMethods: MFAMethod[] = [
  {
    id: "app",
    title: strings.mfaAuthAppTitle(),
    body: strings.mfaAuthAppDesc(),
    icon: "device-mobile-camera"
  },
  {
    id: "sms",
    title: strings.mfaSmsTitle(),
    body: strings.mfaSmsDesc(),
    icon: "chat"
  },
  {
    id: "email",
    title: strings.mfaEmailTitle(),
    body: strings.mfaEmailDesc(),
    icon: "envelope-simple"
  }
];
type MFAMethod = {
  id: "email" | "sms" | "app";
  title?: string;
  body?: string;
  icon?: string;
  recommended?: boolean | undefined;
};

type MFAStep = {
  id: string;
  props: { [name: string]: unknown };
};

type MFAStepProps = {
  recovery?: boolean;
  onSuccess?: (method?: MFAMethod) => void;
  setStep?: Dispatch<SetStateAction<MFAStep>>;
  method?: MFAMethod;
  isSetup?: boolean;
};
export const MFAMethodsPickerStep = ({ recovery, onSuccess }: MFAStepProps) => {
  const { colors } = useThemeColors();
  const user = useUserStore((state) => state.user);
  const featureAvailable = useIsFeatureAvailable("sms2FA");

  const getMethods = () => {
    if (!recovery) return mfaMethods;
    return mfaMethods.filter((m) => m.id !== user?.mfa?.primaryMethod);
  };

  const onMethodPress = (item: MFAMethod) => {
    if (item.id === "sms" && featureAvailable && !featureAvailable?.isAllowed) {
      ToastManager.show({
        message: featureAvailable?.error,
        type: "info",
        context: "local",
        actionText: strings.upgrade(),
        func: () => {
          PaywallSheet.present(featureAvailable);
        }
      });
      return;
    }

    onSuccess && onSuccess(item);
  };

  return (
    <>
      <DialogHeader
        title={strings.twoFactorAuth()}
        paragraph={strings.twoFactorAuthDesc()}
        style={{
          paddingTop: Spacing.LEVEL_2,
          paddingHorizontal: Spacing.LEVEL_3
        }}
      />

      <LineSeparator
        paddingVertical={Spacing.LEVEL_3}
        paddingHorizontal={Spacing.LEVEL_3}
      />

      {getMethods().map((item, index, methods) => (
        <Pressable
          key={item.title}
          onPress={() => onMethodPress(item)}
          style={{
            paddingHorizontal: Spacing.LEVEL_3,
            paddingVertical: Spacing.LEVEL_1,
            marginBottom: index === methods.length - 1 ? 0 : Spacing.LEVEL_0,
            flexDirection: "row",
            borderRadius: Radius.S,
            alignItems: "center",
            backgroundColor: colors.primary.background
          }}
        >
          {item.icon && (
            <View
              style={{
                width: Spacing.LEVEL_7,
                height: Spacing.LEVEL_7,
                borderRadius: Radius.XS,
                marginRight: Spacing.LEVEL_1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.secondary.background
              }}
            >
              <AppIcon
                size={16}
                iconFamily="notesnook"
                color={colors.primary.icon}
                name={item.icon}
              />
            </View>
          )}
          <View
            style={{
              flex: 1,
              flexShrink: 1,
              gap: Spacing.LEVEL_1
            }}
          >
            <Heading size={AppFontSize.md} lineHeight="100%">
              {item.title}
            </Heading>
            <Paragraph size={AppFontSize.sm}>{item.body}</Paragraph>
          </View>
        </Pressable>
      ))}
    </>
  );
};

export const MFASetup = ({
  method,
  onSuccess,
  setStep,
  recovery
}: MFAStepProps) => {
  const { colors } = useThemeColors();
  const user = useUserStore((state) => state.user);
  const methodId = method?.id;
  const formRef = useRef(
    createFormRef({
      target: "",
      code: ""
    })
  );
  const targetInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);
  const [authenticatorDetails, setAuthenticatorDetails] = useState({
    sharedKey: null,
    authenticatorUri: null
  });
  const { seconds, setId, start } = useTimer(method?.id);

  const [loading, setLoading] = useState(method?.id === "app" ? true : false);
  const [enabling, setEnabling] = useState(false);
  const [sending, setSending] = useState(false);
  const [codeValue, setCodeValue] = useState("");
  const [generalError, setGeneralError] = useState<string>();

  useEffect(() => {
    if (methodId === "app") {
      setLoading(true);
      db.mfa
        ?.setup("app")
        .then((data) => {
          setAuthenticatorDetails(data);
          setLoading(false);
        })
        .catch((error: Error) => {
          setLoading(false);
          setGeneralError(error.message);
        });
      return;
    }

    setLoading(false);
  }, [methodId]);

  useEffect(() => {
    if (!methodId) return;

    formRef.current.clearErrors();
    formRef.current.setValue(
      "target",
      methodId === "email"
        ? user?.email || ""
        : methodId === "app"
          ? authenticatorDetails.sharedKey || ""
          : formRef.current.getValue("target")
    );
    formRef.current.setValue("code", "");
    setCodeValue("");
    setGeneralError(undefined);
  }, [authenticatorDetails.sharedKey, methodId, user?.email]);

  const codeHelpText = {
    app: "After putting the above code in authenticator app, the app will display a code that you can enter below.",
    sms: "You will receive a 2FA code on your phone number which you can enter below",
    email:
      "You will receive a 2FA code on your email address which you can enter below"
  };

  const targetValidators =
    method?.id === "sms"
      ? [
          validators.required(strings.phoneNumberNotEntered()),
          (value: string) =>
            isMobilePhone(value, "any", {
              strictMode: true
            })
              ? undefined
              : strings.enterValidPhone()
        ]
      : method?.id === "email"
        ? [
            validators.required(strings.emailRequired()),
            validators.email(strings.enterValidEmail())
          ]
        : [];

  const codeValidators = [
    validators.required(strings.enterSixDigitCode()),
    (value: string) =>
      /^\d{6}$/.test(value.trim()) ? undefined : strings.enterSixDigitCode()
  ];

  const onNext = async () => {
    const code = codeValue.trim();
    const codeValidationError = codeValidators
      .map((validator) => validator(code))
      .find(Boolean);

    if (codeValidationError) {
      setGeneralError(codeValidationError);
      return;
    }

    try {
      if (!method) return;

      setGeneralError(undefined);
      setEnabling(true);
      if (recovery) {
        await db.mfa.enableFallback(method.id, code);
      } else {
        await db.mfa.enable(method.id, code);
      }

      const user = await db.user.fetchUser();
      useUserStore.getState().setUser(user);
      onSuccess && onSuccess(method);
      setEnabling(false);
    } catch (e) {
      const error = e as Error;
      setGeneralError(error.message);
      setEnabling(false);
    }
  };

  const onSendCode = async () => {
    if (!method || sending) return;

    if (method.id !== "app" && formRef.current.validateField("target")) {
      return;
    }

    if (method.id === "app" && authenticatorDetails.sharedKey) {
      Clipboard.setString(authenticatorDetails.sharedKey);
      if (authenticatorDetails.authenticatorUri) {
        await Linking.openURL(authenticatorDetails.authenticatorUri).catch(
          console.log
        );
      }

      ToastManager.show({
        heading: strings.codesCopied(),
        type: "success",
        context: "local"
      });
      return;
    }

    try {
      const target = formRef.current.getValue("target").trim();

      setGeneralError(undefined);
      if (seconds) {
        setGeneralError(strings.resendCodeWait());
        return;
      }

      setSending(true);
      await db.mfa.setup(method.id, method.id === "sms" ? target : undefined);

      if (method.id === "sms") {
        setId(method.id + target);
      }
      await sleep(300);
      start(60, method.id === "sms" ? method.id + target : method.id);
      setSending(false);
      ToastManager.show({
        heading: strings["2faCodeSentVia"](method.id),
        type: "success",
        context: "local"
      });
      codeInputRef.current?.focus();
    } catch (e) {
      setSending(false);
      const error = e as Error;
      if (method.id === "sms" || method.id === "email") {
        formRef.current.setError("target", error.message);
      } else {
        setGeneralError(error.message);
      }
    }
  };

  const onChangeMethodPress = () => {
    setStep &&
      setStep({
        id: "mfapick",
        props: {
          recovery: recovery
        }
      });
  };

  return !method ? null : (
    <View
      style={{
        gap: Spacing.LEVEL_3
      }}
    >
      <DialogHeader
        title={method?.title}
        paragraph={method?.body}
        style={{
          paddingTop: Spacing.LEVEL_2,
          paddingHorizontal: Spacing.LEVEL_3
        }}
      />

      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3
        }}
      >
        {loading ? (
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              marginBottom: 50
            }}
          >
            <ActivityIndicator
              color={colors.primary.accent}
              style={{
                height: 50
              }}
            />
            <Paragraph>
              {strings.gettingInformation()}... {strings.pleaseWait()}
            </Paragraph>
          </View>
        ) : (
          <>
            <FormInput
              key={`${method.id}-${authenticatorDetails.sharedKey || user?.email || ""}`}
              name="target"
              formRef={formRef}
              fwdRef={targetInputRef}
              loading={method?.id !== "sms"}
              editable={method.id === "sms"}
              defaultValue={
                method.id === "email"
                  ? user?.email || ""
                  : method.id === "app"
                    ? authenticatorDetails.sharedKey || ""
                    : undefined
              }
              multiline={method.id === "app"}
              onChangeText={() => {
                setGeneralError(undefined);
              }}
              placeholder={
                method.id === "email"
                  ? strings.enterEmailAddress()
                  : "+1234567890"
              }
              onSubmitEditing={onSendCode}
              validators={targetValidators}
              containerStyle={{
                borderWidth: 0,
                borderRadius: Radius.XS
              }}
              keyboardType={
                method.id === "email" ? "email-address" : "phone-pad"
              }
              buttons={
                <Button
                  onPress={() => {
                    if (method.id === "app" && authenticatorDetails.sharedKey) {
                      Clipboard.setString(authenticatorDetails.sharedKey);
                      ToastManager.show({
                        message: strings.codeCopied(),
                        context: "local",
                        type: "success"
                      });
                    } else {
                      onSendCode();
                    }
                  }}
                  type="transparent"
                  fontFamily="MEDIUM"
                  fontSize={AppFontSize.sm}
                  buttonType={{
                    text: colors.primary.accent
                  }}
                  loading={sending}
                  style={{
                    paddingVertical: 0,
                    paddingHorizontal: 0,
                    marginLeft: Spacing.LEVEL_1
                  }}
                  icon={method.id === "app" ? "copy" : undefined}
                  iconFamily="notesnook"
                  title={
                    sending
                      ? null
                      : method.id === "app"
                        ? strings.copy()
                        : `${
                            seconds
                              ? strings.resendCode(seconds as number)
                              : strings.sendCode()
                          }`
                  }
                />
              }
            />

            <View
              style={{
                height: 1,
                marginVertical: Spacing.LEVEL_3,
                backgroundColor: colors.primary.separator
              }}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: Spacing.LEVEL_1,
                paddingVertical: Spacing.LEVEL_1,
                marginBottom: Spacing.LEVEL_3
              }}
            >
              <View
                style={{
                  width: Spacing.LEVEL_7,
                  height: Spacing.LEVEL_7,
                  borderRadius: Radius.XS,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.secondary.background
                }}
              >
                <AppIcon
                  size={16}
                  iconFamily="notesnook"
                  color={colors.primary.icon}
                  name="device-mobile-camera"
                />
              </View>

              <View
                style={{
                  flex: 1,
                  gap: Spacing.LEVEL_1
                }}
              >
                <Heading size={AppFontSize.md} lineHeight="100%">
                  {strings.enterSixDigitCode()}
                </Heading>
                <Paragraph size={AppFontSize.sm}>
                  {codeHelpText[method?.id]}
                </Paragraph>
              </View>
            </View>

            <PinInput
              value={codeValue}
              length={6}
              inputRef={codeInputRef}
              onSubmitEditing={onNext}
              onChangeText={(value) => {
                formRef.current.setValue("code", value);
                setCodeValue(value);
                setGeneralError(undefined);
              }}
              sanitize={(value) => value.replace(/\D/g, "")}
            />

            {generalError ? (
              <Paragraph
                size={AppFontSize.sm}
                style={{
                  color: colors.error.icon,
                  marginBottom: Spacing.LEVEL_2,
                  textAlign: "center",
                  width: "100%"
                }}
              >
                {generalError}
              </Paragraph>
            ) : null}

            <View
              style={{
                gap: Spacing.LEVEL_2,
                marginTop: Spacing.LEVEL_4
              }}
            >
              <Button
                title={enabling ? null : strings.next()}
                type="accent"
                width="100%"
                onPress={onNext}
                loading={enabling}
                style={{
                  borderRadius: Radius.S
                }}
              />

              <Button
                title={strings.change2faMethod()}
                type="plain-outline"
                width="100%"
                onPress={onChangeMethodPress}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
};

export const MFARecoveryCodes = ({
  method,
  onSuccess,
  isSetup = true
}: MFAStepProps) => {
  const { colors } = useThemeColors();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  const codeRows = [] as string[][];
  for (let i = 0; i < codes.length; i += 3) {
    codeRows.push(codes.slice(i, i + 3));
  }

  useEffect(() => {
    (async () => {
      try {
        const codes = await db.mfa.codes();
        if (codes) setCodes(codes);
        setLoading(false);
      } catch (e) {
        const error = e as Error;
        ToastManager.error(error, strings.errorGettingCodes(), "local");
        setLoading(false);
      }
    })();
  }, []);

  const onCopyCodesPress = () => {
    const codeString = codes.join("\n");
    Clipboard.setString(codeString);
    ToastManager.show({
      heading: strings.codesCopied(),
      type: "success",
      context: "local"
    });
  };

  const onSaveToFilePress = async () => {
    try {
      let path;
      let fileName = "notesnook_recoverycodes";
      fileName = sanitizeFilename(fileName, {
        replacement: "_"
      });
      fileName = fileName + ".txt";
      const codeString = codes.join("\n");
      if (Platform.OS === "android") {
        const file = await ScopedStorage.createDocument(
          fileName,
          "text/plain",
          codeString,
          "utf8"
        );
        if (!file) return;
        path = file.uri;
      } else {
        path = await filesystem.checkAndCreateDir("/");
        await RNFetchBlob.fs.writeFile(path + fileName, codeString, "utf8");
        path = path + fileName;
      }

      ToastManager.show({
        heading: strings.codesSaved(),
        type: "success",
        context: "local"
      });
      return path;
    } catch (e) {
      console.error(e);
    }
  };

  const onCompletePress = () => {
    if (isSetup) {
      onSuccess && onSuccess(method);
    } else {
      eSendEvent(eCloseSheet);
    }
  };

  return (
    <View
      style={{
        gap: Spacing.LEVEL_3
      }}
    >
      <DialogHeader
        title={strings.saveRecoveryCodes()}
        paragraph={strings.saveRecoveryCodesDesc()}
        style={{
          paddingTop: Spacing.LEVEL_2,
          paddingHorizontal: Spacing.LEVEL_3
        }}
      />

      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3
        }}
      >
        {loading ? (
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              marginBottom: 50
            }}
          >
            <ActivityIndicator
              color={colors.primary.accent}
              style={{
                height: 50
              }}
            />
            <Paragraph>
              {strings.gettingRecoveryCodes()}... {strings.pleaseWait()}
            </Paragraph>
          </View>
        ) : (
          <>
            <View
              style={{
                backgroundColor: colors.secondary.background,
                borderRadius: Radius.S,
                paddingHorizontal: Spacing.LEVEL_2,
                paddingVertical: Spacing.LEVEL_3,
                gap: Spacing.LEVEL_1
              }}
            >
              {codeRows.map((row, rowIndex) => (
                <View
                  key={`row-${rowIndex}`}
                  style={{
                    flexDirection: "row",
                    gap: Spacing.LEVEL_2
                  }}
                >
                  {row.map((code, colIndex) => (
                    <Paragraph
                      key={`${rowIndex}-${colIndex}`}
                      size={AppFontSize.xs}
                      style={{
                        flex: 1,
                        color: colors.primary.heading
                      }}
                    >
                      {code}
                    </Paragraph>
                  ))}
                  {row.length < 3
                    ? Array.from({ length: 3 - row.length }).map((_, idx) => (
                        <View
                          key={`empty-${rowIndex}-${idx}`}
                          style={{ flex: 1 }}
                        />
                      ))
                    : null}
                </View>
              ))}

              <View
                style={{
                  height: 1,
                  marginTop: Spacing.LEVEL_1,
                  backgroundColor: colors.primary.separator
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  gap: Spacing.LEVEL_2,
                  marginTop: Spacing.LEVEL_1
                }}
              >
                <Button
                  title={strings.copyCodes()}
                  type="transparent"
                  fontFamily="SEMI_BOLD"
                  fontSize={AppFontSize.xs}
                  icon="content-copy"
                  iconSize={14}
                  iconColor={colors.primary.accent}
                  buttonType={{ text: colors.primary.accent }}
                  onPress={onCopyCodesPress}
                  style={{
                    flex: 1,
                    borderRadius: Radius.S,
                    paddingVertical: Spacing.LEVEL_1,
                    paddingHorizontal: Spacing.LEVEL_1
                  }}
                />

                <Button
                  title={strings.saveToFile()}
                  type="transparent"
                  fontFamily="SEMI_BOLD"
                  fontSize={AppFontSize.xs}
                  icon="download-simple"
                  iconFamily="notesnook"
                  iconSize={14}
                  iconColor={colors.primary.accent}
                  buttonType={{ text: colors.primary.accent }}
                  onPress={onSaveToFilePress}
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.LEVEL_1,
                    paddingHorizontal: Spacing.LEVEL_1,
                    borderRadius: Radius.S
                  }}
                />
              </View>
            </View>

            <Button
              title={isSetup ? strings.next() : strings.done()}
              type="accent"
              width="100%"
              onPress={onCompletePress}
              style={{
                borderRadius: Radius.S,
                marginTop: Spacing.LEVEL_2,
                marginBottom: Spacing.LEVEL_2
              }}
            />
          </>
        )}
      </View>
    </View>
  );
};

MFARecoveryCodes.present = (methodId: MFAMethod["id"]) => {
  presentSheet({
    component: <MFARecoveryCodes method={{ id: methodId }} isSetup={false} />
  });
};

const MFASuccess = ({ recovery }: MFAStepProps) => {
  const { colors, isDark } = useThemeColors();

  const onDonePress = () => {
    eSendEvent(eCloseSheet);
  };

  const onSecondaryMethodPress = () => {
    MFASheet.present(true);
  };

  return (
    <View
      style={{
        gap: Spacing.LEVEL_4
      }}
    >
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          marginTop: Spacing.LEVEL_4
        }}
      >
        <View
          style={{
            width: 93,
            height: 93,
            borderRadius: 46.5,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "#0A572920" : "#00883614"
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "#0A572930" : "#0088361F"
            }}
          >
            <View
              style={{
                width: 47,
                height: 47,
                borderRadius: 23.5,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.primary.accent
              }}
            >
              <AppIcon
                name="check"
                size={20}
                color={colors.primary.accentForeground}
              />
            </View>
          </View>
        </View>
      </View>

      <View
        style={{
          alignItems: "center",
          gap: Spacing.LEVEL_1,
          paddingHorizontal: Spacing.LEVEL_3
        }}
      >
        <Heading
          size={AppFontSize.xl}
          lineHeight="100%"
          style={{ textAlign: "center" }}
        >
          {recovery
            ? strings.fallbackMethodEnabled()
            : strings.twoFactorAuthEnabled()}
        </Heading>
        <Paragraph size={AppFontSize.xs} style={{ textAlign: "center" }}>
          {strings.accountIsSecure()}
        </Paragraph>
      </View>

      <View
        style={{
          width: "100%",
          gap: Spacing.LEVEL_2,
          paddingHorizontal: Spacing.LEVEL_3
        }}
      >
        <Button
          title={strings.done()}
          type="accent"
          width="100%"
          onPress={onDonePress}
          style={{
            borderRadius: Radius.S
          }}
        />

        {!recovery ? (
          <Button
            title={strings.secondary2faMethod()}
            type="plain-outline"
            width="100%"
            onPress={onSecondaryMethodPress}
            style={{
              borderRadius: Radius.S
            }}
          />
        ) : null}
      </View>
    </View>
  );
};

export const MFASheet = ({ recovery }: { recovery?: boolean }) => {
  const [step, setStep] = useState<MFAStep>({
    id: "mfapick",
    props: {
      recovery: recovery
    }
  });

  const steps: { [name: string]: JSX.Element } = {
    mfapick: (
      <MFAMethodsPickerStep
        recovery={recovery}
        onSuccess={(method) => {
          setStep({
            id: "setup",
            props: {
              method: method
            }
          });
        }}
      />
    ),
    setup: (
      <MFASetup
        recovery={recovery}
        setStep={setStep}
        {...step.props}
        onSuccess={(method) => {
          setStep({
            id: "recoveryCodes",
            props: {
              method: method
            }
          });
        }}
      />
    ),
    recoveryCodes: (
      <MFARecoveryCodes
        recovery={recovery}
        {...step.props}
        onSuccess={(method) => {
          setStep({
            id: "success",
            props: {
              method: method
            }
          });
        }}
      />
    ),
    success: <MFASuccess {...step.props} recovery={recovery} />
  };

  return <View>{steps[step.id]}</View>;
};

MFASheet.present = (recovery?: boolean) => {
  presentSheet({
    component: <MFASheet recovery={recovery} />
  });
};
