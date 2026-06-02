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
import { usePromise } from "@notesnook/common";
import { InboxApiKey } from "@notesnook/core";
import { SerializedKeyPair } from "@notesnook/crypto";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import dayjs from "dayjs";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { DatabaseLogger, db } from "../../common/database";
import { Storage } from "../../common/database/storage";
import { presentDialog } from "../../components/dialog/functions";
import AddApiKeySheet from "../../components/sheets/add-api-key";
import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import Input from "../../components/ui/input";
import FormInput, {
  createFormRef,
  validators
} from "../../components/ui/input/form-input";
import { Notice } from "../../components/ui/notice";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useSettingStore } from "../../stores/use-setting-store";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import AppIcon from "../../components/ui/AppIcon";

export const SetupInboxKeys = () => {
  const [mode, setMode] = useState<"choose" | "edit">("choose");
  const [error, setError] = useState("");
  const { colors } = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(
    createFormRef({
      publicKey: "",
      privateKey: ""
    })
  );

  const handleAutoGenerate = async () => {
    try {
      setIsLoading(true);
      await db.user.getInboxKeys();
      ToastManager.show({
        message: strings.inboxKeysSaved(),
        type: "success"
      });
      useSettingStore.setState({
        inboxEnabled: true
      });
      Navigation.goBack();
    } catch (error) {
      DatabaseLogger.error(error as Error);
      ToastManager.error(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formRef.current.validate()) return;
      const keysEdited: SerializedKeyPair = {
        publicKey: formRef.current.getValue("publicKey"),
        privateKey: formRef.current.getValue("privateKey")
      };

      const result = await Storage.validatePGPKeyPair(keysEdited);

      if (!result.isValid) {
        setError(result.message);
        return;
      }
      await db.user?.saveInboxKeys(keysEdited);
      useSettingStore.setState({
        inboxEnabled: true
      });
      Navigation.goBack();
      ToastManager.show({
        message: strings.inboxKeysSaved(),
        type: "success"
      });
    } catch (e) {
      DatabaseLogger.error(e);
      ToastManager.error(e as Error);
    }
  };

  return (
    <View>
      {mode === "choose" ? (
        <>
          <View
            style={{
              paddingHorizontal: DefaultAppStyles.GAP,
              gap: DefaultAppStyles.GAP_VERTICAL
            }}
          >
            <Paragraph>{strings.setupInboxPgpKeysDescription()}</Paragraph>
            <View style={{ gap: DefaultAppStyles.GAP_VERTICAL }}>
              <Button
                title={strings.autoGenerateKeys()}
                type="accent"
                width="100%"
                onPress={handleAutoGenerate}
                disabled={isLoading}
              />
              <Button
                title={strings.provideOwnKeys()}
                type="secondary"
                width="100%"
                onPress={() => setMode("edit")}
                disabled={isLoading}
              />
            </View>
          </View>
        </>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: DefaultAppStyles.GAP,
            gap: DefaultAppStyles.GAP_VERTICAL,
            marginTop: DefaultAppStyles.GAP_VERTICAL
          }}
        >
          <Paragraph>{strings.publicKey()}</Paragraph>
          <FormInput
            name="publicKey"
            formRef={formRef}
            numberOfLines={5}
            validators={[validators.required(strings.publicKeyRequired())]}
            placeholder={strings.enterPgpPublicKey()}
            multiline
            containerStyle={{ minHeight: 150, alignItems: "flex-start" }}
            inputStyle={{ minHeight: 150, textAlignVertical: "top" }}
            wrapperStyle={{ minHeight: 150 }}
          />
          <Paragraph>{strings.privateKey()}</Paragraph>
          <FormInput
            name="privateKey"
            formRef={formRef}
            numberOfLines={5}
            placeholder={strings.enterPgpPrivateKey()}
            validators={[validators.required(strings.privateKeyRequired())]}
            multiline
            containerStyle={{ minHeight: 150, alignItems: "flex-start" }}
            inputStyle={{ minHeight: 150, textAlignVertical: "top" }}
            wrapperStyle={{ minHeight: 150 }}
          />

          {error ? (
            <Paragraph
              numberOfLines={4}
              onPress={() => {}}
              color={colors.error.accent}
              style={{
                textAlign: "center"
              }}
            >
              <AppIcon
                color={colors.error.accent}
                name="alert-circle-outline"
                size={AppFontSize.sm - 1}
              />{" "}
              {error}
            </Paragraph>
          ) : null}

          <Button
            title={strings.save()}
            type="accent"
            width={"100%"}
            onPress={handleSave}
          />
        </ScrollView>
      )}
    </View>
  );
};

const ManageInboxKeys = () => {
  const { colors } = useThemeColors();
  const keys = usePromise(() => db.user.getInboxKeys());
  const inboxKeys = keys.status === "fulfilled" ? keys.value : undefined;
  const formRef = useRef(
    createFormRef({
      publicKey: "",
      privateKey: ""
    })
  );
  const [formVersion, setFormVersion] = useState(0);
  const [hasChanged, setHasChanged] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!inboxKeys) return;

    formRef.current.setValue("publicKey", inboxKeys.publicKey || "");
    formRef.current.setValue("privateKey", inboxKeys.privateKey || "");
    setFormVersion((prev) => prev + 1);
  }, [inboxKeys]);

  useEffect(() => {
    const unsub = formRef.current?.subscribeChange(() => {
      const values = formRef.current?.getValues();
      if (
        inboxKeys?.publicKey !== values.publicKey ||
        inboxKeys.privateKey !== values.privateKey
      ) {
        setHasChanged(true);
      } else {
        setHasChanged(false);
      }
      setError("");
    });
    return unsub;
  }, [inboxKeys?.privateKey, inboxKeys?.publicKey]);

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: DefaultAppStyles.GAP,
        gap: DefaultAppStyles.GAP_VERTICAL,
        marginTop: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      <Notice type="alert" text={strings.changingInboxPgpKeysNotice()} />

      <Paragraph>{strings.publicKey()}</Paragraph>
      <FormInput
        key={`public-key-${formVersion}`}
        name="publicKey"
        formRef={formRef}
        validators={[validators.required(strings.publicKeyRequired())]}
        multiline
        containerStyle={{ minHeight: 150, alignItems: "flex-start" }}
        inputStyle={{ height: 140, textAlignVertical: "top" }}
        wrapperStyle={{ minHeight: 150 }}
      />
      <Paragraph>{strings.privateKey()}</Paragraph>
      <FormInput
        key={`private-key-${formVersion}`}
        name="privateKey"
        formRef={formRef}
        validators={[validators.required(strings.privateKeyRequired())]}
        multiline
        containerStyle={{ minHeight: 150, alignItems: "flex-start" }}
        inputStyle={{ height: 140, textAlignVertical: "top" }}
        wrapperStyle={{ minHeight: 150 }}
      />

      {error ? (
        <Paragraph
          numberOfLines={4}
          onPress={() => {}}
          color={colors.error.accent}
          style={{
            textAlign: "center"
          }}
        >
          <AppIcon
            color={colors.error.accent}
            name="alert-circle-outline"
            size={AppFontSize.sm - 1}
          />{" "}
          {error}
        </Paragraph>
      ) : null}

      <Button
        title={strings.save()}
        disabled={!hasChanged}
        type="accent"
        width={"100%"}
        onPress={async () => {
          try {
            const keysEdited: SerializedKeyPair = {
              publicKey: formRef.current.getValue("publicKey"),
              privateKey: formRef.current.getValue("privateKey")
            };

            if (!keysEdited.privateKey || !keysEdited.publicKey) {
              if (!formRef.current.validate()) return;
            }

            const result = await Storage.validatePGPKeyPair(keysEdited);

            if (!result.isValid) {
              setError(result.message);
              return;
            }

            presentDialog({
              title: strings.areYouSure(),
              paragraph: strings.changingInboxPgpKeysNotice(),
              positiveText: strings.yes(),
              negativeText: strings.no(),
              positivePress: async () => {
                try {
                  await db.user?.saveInboxKeys(keysEdited);
                  ToastManager.show({
                    message: strings.inboxKeysSaved(),
                    type: "success"
                  });
                  Navigation.goBack();
                  return true;
                } catch (e) {
                  ToastManager.error(e as Error);
                  DatabaseLogger.error(e);
                  return false;
                }
              }
            });
          } catch (e) {
            DatabaseLogger.error(e);
            ToastManager.error(e as Error);
          }
        }}
      />
    </ScrollView>
  );
};

const InboxKeysList = () => {
  const inboxEnabled = useSettingStore((state) => state.inboxEnabled);
  const apiKeysPromise = usePromise(
    () => db.inboxApiKeys.get(),
    [inboxEnabled]
  );
  const { colors } = useThemeColors();

  if (apiKeysPromise.status === "pending") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: DefaultAppStyles.GAP,
          gap: DefaultAppStyles.GAP_VERTICAL,
          width: "100%"
        }}
      >
        <ActivityIndicator size="small" color={colors.primary.accent} />
        <Paragraph color={colors.secondary.paragraph}>
          {strings.loadingApiKeys()}
        </Paragraph>
      </View>
    );
  }

  if (apiKeysPromise.status === "rejected") {
    DatabaseLogger.log(apiKeysPromise.reason);
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: DefaultAppStyles.GAP,
          gap: DefaultAppStyles.GAP_VERTICAL,
          width: "100%"
        }}
      >
        <Paragraph color={colors.error.paragraph}>
          {strings.failedToLoadApiKeys()}
        </Paragraph>
        <Button
          title={strings.retry()}
          type="accent"
          onPress={() => apiKeysPromise.refresh()}
        />
      </View>
    );
  }

  const apiKeys = apiKeysPromise.value || [];

  return (
    <ScrollView
      contentContainerStyle={{
        gap: DefaultAppStyles.GAP_VERTICAL,
        paddingVertical: DefaultAppStyles.GAP_VERTICAL,
        width: "100%",
        paddingHorizontal: DefaultAppStyles.GAP,
        paddingBottom: 50,
        minHeight: "100%"
      }}
    >
      {apiKeys.length === 0 ? (
        <View
          style={{
            padding: DefaultAppStyles.GAP * 2,
            alignItems: "center",
            gap: DefaultAppStyles.GAP_VERTICAL,
            flex: 1,
            justifyContent: "center"
          }}
        >
          <Paragraph color={colors.secondary.paragraph}>
            {strings.createFirstApiKey()}
          </Paragraph>

          <Button
            title={strings.createKey()}
            type="accent"
            style={{
              paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
              width: "100%"
            }}
            onPress={() => {
              if (apiKeys.length >= 10) {
                presentDialog({
                  title: strings.apiKeysLimitReached(),
                  paragraph: strings.apiKeysLimitReachedMessage(),
                  positiveText: strings.ok()
                });
              } else {
                AddApiKeySheet.present(() => apiKeysPromise.refresh());
              }
            }}
          />
        </View>
      ) : (
        <View style={{ gap: 0 }}>
          {apiKeys.map((key, i) => (
            <ApiKeyItem
              key={key.key}
              apiKey={key}
              onRevoke={() => apiKeysPromise.refresh()}
              isAtEnd={i === apiKeys.length - 1}
            />
          ))}

          <Button
            title={strings.createKey()}
            type="accent"
            style={{
              paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
              width: "100%"
            }}
            onPress={() => {
              if (apiKeys.length >= 10) {
                presentDialog({
                  title: strings.apiKeysLimitReached(),
                  paragraph: strings.apiKeysLimitReachedMessage(),
                  positiveText: strings.ok()
                });
              } else {
                AddApiKeySheet.present(() => apiKeysPromise.refresh());
              }
            }}
          />
        </View>
      )}
    </ScrollView>
  );
};

const VIEW_KEY_TIMEOUT = 15;

type ApiKeyItemProps = {
  apiKey: InboxApiKey;
  onRevoke: () => void;
  isAtEnd: boolean;
};

function ApiKeyItem({ apiKey, onRevoke, isAtEnd }: ApiKeyItemProps) {
  const { colors } = useThemeColors();
  const [copied, setCopied] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(VIEW_KEY_TIMEOUT);

  async function viewKey() {
    presentDialog({
      title: strings.authenticateToViewApiKey(),
      paragraph: strings.enterPasswordToViewApiKey(),
      positiveText: strings.authenticate(),
      negativeText: strings.cancel(),
      input: true,
      secureTextEntry: true,
      inputPlaceholder: strings.accountPassword(),
      positivePress: async (value) => {
        try {
          const verified = await db.user.verifyPassword(value);
          if (!verified) {
            ToastManager.show({
              message: strings.invalidPassword(),
              type: "error"
            });
            return false;
          }
          setViewing(true);
          return true;
        } catch (error) {
          ToastManager.error(error as Error);
          return false;
        }
      }
    });
  }

  async function copyToClipboard() {
    if (!viewing) return;
    try {
      Clipboard.setString(apiKey.key);
      setCopied(true);
      ToastManager.show({
        message: strings.apiKeyCopiedToClipboard(),
        type: "success"
      });
    } catch (error) {
      ToastManager.show({
        message: strings.failedToCopyToClipboard(),
        type: "error"
      });
    }
  }

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    if (viewing) {
      setSecondsLeft(VIEW_KEY_TIMEOUT);
      const interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setViewing(false);
            return VIEW_KEY_TIMEOUT;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [viewing]);

  const isApiKeyExpired =
    apiKey.expiryDate !== -1 && Date.now() > apiKey.expiryDate;

  return (
    <View
      style={{
        paddingVertical: DefaultAppStyles.GAP_VERTICAL,
        borderBottomWidth: isAtEnd ? 0 : 1,
        borderBottomColor: colors.secondary.border
      }}
    >
      <View
        style={{
          flexDirection: "column",
          gap: DefaultAppStyles.GAP_VERTICAL
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: DefaultAppStyles.GAP_SMALL
          }}
        >
          <Heading size={AppFontSize.md}>{apiKey.name}</Heading>
          {isApiKeyExpired && (
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 8,
                backgroundColor: colors.error.background,
                borderRadius: 5
              }}
            >
              <Paragraph
                color={colors.static.red}
                size={AppFontSize.xxs}
                style={{ fontWeight: "bold" }}
              >
                EXPIRED
              </Paragraph>
            </View>
          )}
        </View>

        <View style={{ gap: 4 }}>
          <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
            {apiKey.lastUsedAt
              ? `${strings.lastUsedOn()} ${dayjs(apiKey.lastUsedAt).format("MMM DD, YYYY")}`
              : strings.neverUsed()}
          </Paragraph>
          <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
            {strings.createdOn()}{" "}
            {dayjs(apiKey.dateCreated).format("MMM DD, YYYY")}
          </Paragraph>
          <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
            {apiKey.expiryDate === -1
              ? strings.neverExpires()
              : `${isApiKeyExpired ? strings.expired() : strings.expiresOn()} ${dayjs(apiKey.expiryDate).format("MMM DD, YYYY")}`}
          </Paragraph>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: DefaultAppStyles.GAP_SMALL
          }}
        >
          <Input
            editable={false}
            value={
              viewing
                ? apiKey.key
                : `${apiKey.key.slice(0, 10)}${"*".repeat(
                    apiKey.key.length - 10
                  )}`
            }
            style={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: AppFontSize.xs
            }}
            wrapperStyle={{
              flex: 1
            }}
          />
          {!viewing && (
            <IconButton
              name="eye-off-outline"
              color={colors.primary.icon}
              onPress={() => viewKey()}
            />
          )}
          {viewing && (
            <>
              <Paragraph
                style={{
                  fontFamily: "monospace",
                  minWidth: 35,
                  textAlign: "center"
                }}
                color={colors.primary.accent}
              >
                {secondsLeft}s
              </Paragraph>
              <IconButton
                name={copied ? "check" : "content-copy"}
                color={colors.primary.icon}
                onPress={() => copyToClipboard()}
              />
            </>
          )}
          <IconButton
            name="delete-outline"
            color={colors.error.icon}
            disabled={isRevoking}
            onPress={async () => {
              presentDialog({
                title: strings.revokeInboxApiKey(apiKey.name),
                paragraph: strings.revokeApiKeyConfirmation(apiKey.name),
                positiveText: strings.revoke(),
                negativeText: strings.cancel(),
                positiveType: "error",
                positivePress: async () => {
                  try {
                    setIsRevoking(true);
                    await db.inboxApiKeys.revoke(apiKey.key);
                    onRevoke();
                    ToastManager.show({
                      message: strings.apiKeyRevoked(),
                      type: "success"
                    });
                    return true;
                  } catch (error) {
                    ToastManager.show({
                      message: strings.failedToRevokeApiKey(),
                      type: "error"
                    });
                    return false;
                  } finally {
                    setIsRevoking(false);
                  }
                }
              });
            }}
          />
        </View>
      </View>
    </View>
  );
}

export { InboxKeysList, ManageInboxKeys };
