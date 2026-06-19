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
import { getFormattedDate, usePromise } from "@notesnook/common";
import { InboxApiKey } from "@notesnook/core";
import { SerializedKeyPair } from "@notesnook/crypto";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { DatabaseLogger, db } from "../../common/database";
import { Storage } from "../../common/database/storage";
import { Radius, Spacing } from "../../common/design/spacing";
import { presentDialog } from "../../components/dialog/functions";
import AddApiKeySheet from "../../components/sheets/add-api-key";
import AppIcon from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/button";
import CirclesBackground from "../../components/ui/circles-background";
import { IconButton } from "../../components/ui/icon-button";
import FormInput, {
  createFormRef,
  validators
} from "../../components/ui/input/form-input";
import { Notice } from "../../components/ui/notice";
import { Pressable } from "../../components/ui/pressable";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useSettingStore } from "../../stores/use-setting-store";
import { AppFontSize } from "../../utils/size";

type InboxKeysOption = "auto" | "own";
type SetupStep = "choose" | "edit" | "create-key" | "success";

const getExpiryOptions = () => [
  { label: strings.expiryOneDay(), value: 24 * 60 * 60 * 1000 },
  { label: strings.expiryOneWeek(), value: 7 * 24 * 60 * 60 * 1000 },
  { label: strings.expiryOneMonth(), value: 30 * 24 * 60 * 60 * 1000 },
  { label: strings.expiryOneYear(), value: 365 * 24 * 60 * 60 * 1000 },
  { label: strings.never(), value: -1 }
];

export const SetupInboxKeys = () => {
  const [mode, setMode] = useState<SetupStep>("choose");
  const [option, setOption] = useState<InboxKeysOption>("auto");
  const [error, setError] = useState("");
  const { colors } = useThemeColors();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(
    createFormRef({
      publicKey: "",
      privateKey: ""
    })
  );
  const keyFormRef = useRef(
    createFormRef({
      keyName: ""
    })
  );
  const [selectedExpiry, setSelectedExpiry] = useState(
    getExpiryOptions()[2].value
  );
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [createdKey, setCreatedKey] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

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
      setMode("create-key");
    } catch (error) {
      DatabaseLogger.error(error as Error);
      ToastManager.error(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (option === "auto") {
      handleAutoGenerate();
    } else {
      setMode("edit");
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
      ToastManager.show({
        message: strings.inboxKeysSaved(),
        type: "success"
      });
      setMode("create-key");
    } catch (e) {
      DatabaseLogger.error(e);
      ToastManager.error(e as Error);
    }
  };

  const pasteInto = async (name: "publicKey" | "privateKey") => {
    const value = await Clipboard.getString();
    if (!value) return;
    formRef.current.setValue(name, value.trim());
  };

  const handleCreateKey = async () => {
    if (keyFormRef.current.validateField("keyName")) return;
    const keyName = keyFormRef.current.getValue("keyName").trim();
    try {
      setIsCreatingKey(true);
      await db.inboxApiKeys.create(keyName, selectedExpiry);
      const keys = await db.inboxApiKeys.get();
      const created = keys
        ?.slice()
        .sort((a, b) => b.dateCreated - a.dateCreated)[0];
      setCreatedKey(created?.key || "");
      setMode("success");
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      DatabaseLogger.error(e);
      ToastManager.show({
        message: strings.failedToCreateApiKey(message),
        type: "error"
      });
      keyFormRef.current.setError(
        "keyName",
        message || strings.failedToCreateApiKey("")
      );
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (!createdKey) return;
    Clipboard.setString(createdKey);
    setCopied(true);
    ToastManager.show({
      message: strings.apiKeyCopiedToClipboard(),
      type: "success"
    });
  };

  return (
    <View>
      {mode === "choose" ? (
        <View
          style={{
            paddingHorizontal: Spacing.LEVEL_3,
            alignItems: "center"
          }}
        >
          <CirclesBackground
            style={{
              marginBottom: Spacing.LEVEL_6
            }}
            size={120}
          >
            <AppIcon
              name="shield-check"
              iconFamily="notesnook"
              size={22}
              color={colors.static.white}
            />
          </CirclesBackground>

          <View style={{ gap: Spacing.LEVEL_3, width: "100%" }}>
            <View style={{ gap: Spacing.LEVEL_1 }}>
              <Heading
                fontSize="XL"
                lineHeight="100%"
                style={{ textAlign: "center" }}
              >
                {strings.setupInboxKeys()}
              </Heading>
              <Paragraph
                color={colors.secondary.paragraph}
                style={{ textAlign: "center" }}
              >
                {strings.setupInboxKeysDesc()}
              </Paragraph>
            </View>

            <View style={{ gap: Spacing.LEVEL_2 }}>
              <InboxKeysOptionCard
                title={strings.autoGenerateKeys()}
                description={strings.autoGenerateKeysDesc()}
                selected={option === "auto"}
                onPress={() => setOption("auto")}
              />
              <InboxKeysOptionCard
                title={strings.provideOwnKeys()}
                description={strings.provideOwnKeysDesc()}
                selected={option === "own"}
                onPress={() => setOption("own")}
              />
            </View>

            <Button
              title={strings.continue()}
              type="accent"
              width="100%"
              onPress={handleContinue}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>
        </View>
      ) : null}

      {mode === "edit" ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: Spacing.LEVEL_3,
            gap: Spacing.LEVEL_4
          }}
        >
          <View style={{ gap: Spacing.LEVEL_1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
                {strings.publicKey()}
              </Paragraph>
              <Paragraph
                fontSize="XS"
                color={colors.primary.accent}
                fontFamily="SEMI_BOLD"
                onPress={() => pasteInto("publicKey")}
              >
                {strings.paste()}
              </Paragraph>
            </View>
            <FormInput
              name="publicKey"
              formRef={formRef}
              numberOfLines={5}
              validators={[validators.required(strings.publicKeyRequired())]}
              placeholder={strings.enterPgpPublicKey()}
              multiline
              containerStyle={{
                minHeight: 150,
                alignItems: "flex-start",
                borderRadius: Radius.XS
              }}
              inputStyle={{ minHeight: 150, textAlignVertical: "top" }}
              wrapperStyle={{ minHeight: 150 }}
            />
          </View>

          <View style={{ gap: Spacing.LEVEL_1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
                {strings.privateKey()}
              </Paragraph>
              <Paragraph
                fontSize="XS"
                color={colors.primary.accent}
                onPress={() => pasteInto("privateKey")}
                fontFamily="SEMI_BOLD"
              >
                {strings.paste()}
              </Paragraph>
            </View>
            <FormInput
              name="privateKey"
              formRef={formRef}
              numberOfLines={5}
              placeholder={strings.enterPgpPrivateKey()}
              validators={[validators.required(strings.privateKeyRequired())]}
              multiline
              containerStyle={{
                minHeight: 150,
                alignItems: "flex-start",
                borderRadius: Radius.XS
              }}
              inputStyle={{ minHeight: 150, textAlignVertical: "top" }}
              wrapperStyle={{ minHeight: 150 }}
            />
          </View>

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
      ) : null}

      {mode === "create-key" ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: Spacing.LEVEL_3,
            gap: Spacing.LEVEL_4
          }}
        >
          <View style={{ gap: Spacing.LEVEL_1 }}>
            <Heading fontSize="XL" lineHeight="100%">
              {strings.createApiKey()}
            </Heading>
            <Paragraph color={colors.secondary.paragraph}>
              {strings.createApiKeyDesc()}
            </Paragraph>
          </View>

          <FormInput
            name="keyName"
            formRef={keyFormRef}
            label={strings.keyName()}
            placeholder={strings.exampleKeyName()}
            validators={[validators.required(strings.enterKeyName())]}
            containerStyle={{ borderRadius: Radius.XS }}
            onChangeText={() =>
              keyFormRef.current.setError("keyName", undefined)
            }
            onSubmitEditing={handleCreateKey}
          />

          <View style={{ gap: Spacing.LEVEL_2 }}>
            <Heading fontSize="MD" lineHeight="100%">
              {strings.expiresIn()}
            </Heading>
            <View style={{ gap: Spacing.LEVEL_2 }}>
              {getExpiryOptions().map((expiryOption) => {
                const selected = selectedExpiry === expiryOption.value;
                return (
                  <Pressable
                    key={expiryOption.label}
                    onPress={() => setSelectedExpiry(expiryOption.value)}
                    type={selected ? "selected" : "transparent"}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: Spacing.LEVEL_2,
                      borderRadius: Radius.XS,
                      borderWidth: selected ? 0 : 1,
                      borderColor: colors.secondary.border
                    }}
                  >
                    <Heading
                      fontFamily="MEDIUM"
                      fontSize="SM"
                      lineHeight="100%"
                      color={
                        selected
                          ? colors.selected.heading
                          : colors.secondary.heading
                      }
                    >
                      {expiryOption.label}
                    </Heading>
                    <AppIcon
                      name={selected ? "radiobox-marked" : "radiobox-blank"}
                      size={16}
                      color={
                        selected
                          ? colors.selected.accent
                          : colors.secondary.icon
                      }
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Button
            title={isCreatingKey ? strings.creating() : strings.create()}
            type="accent"
            width="100%"
            loading={isCreatingKey}
            disabled={isCreatingKey}
            onPress={handleCreateKey}
          />
        </ScrollView>
      ) : null}

      {mode === "success" ? (
        <View
          style={{
            paddingHorizontal: Spacing.LEVEL_3,
            alignItems: "center"
          }}
        >
          <CirclesBackground
            style={{
              marginBottom: Spacing.LEVEL_6
            }}
            size={120}
          >
            <AppIcon name="check" size={20} color={colors.static.white} />
          </CirclesBackground>

          <View style={{ gap: Spacing.LEVEL_4, width: "100%" }}>
            <View style={{ gap: Spacing.LEVEL_1 }}>
              <Heading
                fontSize="XL"
                lineHeight="100%"
                style={{ textAlign: "center" }}
              >
                {strings.apiKeyCreatedSuccessfully()}
              </Heading>
              <Paragraph
                color={colors.secondary.paragraph}
                style={{ textAlign: "center" }}
              >
                {strings.apiKeyCreatedDesc()}
              </Paragraph>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: Spacing.LEVEL_1,
                paddingHorizontal: Spacing.LEVEL_2,
                paddingVertical: Spacing.LEVEL_1,
                backgroundColor: colors.secondary.background,
                borderRadius: Radius.XS
              }}
            >
              <Paragraph
                numberOfLines={1}
                style={{ flex: 1, fontFamily: "monospace" }}
                fontSize="SM"
                color={colors.primary.paragraph}
              >
                {createdKey}
              </Paragraph>
              <IconButton
                name={copied ? "check" : "content-copy"}
                size={AppFontSize.md}
                color={colors.primary.icon}
                onPress={handleCopyKey}
              />
            </View>

            <Button
              title={strings.done()}
              type="accent"
              width="100%"
              onPress={() => Navigation.goBack()}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

type InboxKeysOptionCardProps = {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
};

function InboxKeysOptionCard({
  title,
  description,
  selected,
  onPress
}: InboxKeysOptionCardProps) {
  const { colors } = useThemeColors();
  return (
    <Pressable
      type="transparent"
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: Spacing.LEVEL_1,
        padding: Spacing.LEVEL_2,
        borderRadius: Radius.XS,
        borderWidth: 1,
        borderColor: selected ? colors.primary.accent : colors.primary.border,
        backgroundColor: selected ? colors.selected.background : "transparent"
      }}
    >
      <AppIcon
        name={selected ? "radiobox-marked" : "radiobox-blank"}
        size={AppFontSize.md}
        color={selected ? colors.primary.accent : colors.secondary.icon}
        style={{ marginTop: 1 }}
      />
      <View style={{ flex: 1, gap: Spacing.LEVEL_1 }}>
        <Heading fontSize="SM" lineHeight="100%">
          {title}
        </Heading>
        <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
          {description}
        </Paragraph>
      </View>
    </Pressable>
  );
}

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

  const pasteInto = async (name: "publicKey" | "privateKey") => {
    const value = await Clipboard.getString();
    if (!value) return;
    formRef.current.setValue(name, value.trim());
    setFormVersion((prev) => prev + 1);
  };

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
        paddingHorizontal: Spacing.LEVEL_3,
        gap: Spacing.LEVEL_4
      }}
    >
      <Notice type="alert" text={strings.changingInboxPgpKeysNotice()} />

      <View style={{ gap: Spacing.LEVEL_1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
            {strings.publicKey()}
          </Paragraph>
          <Paragraph
            fontSize="XS"
            color={colors.primary.accent}
            fontFamily="SEMI_BOLD"
            onPress={() => pasteInto("publicKey")}
          >
            {strings.paste()}
          </Paragraph>
        </View>
        <FormInput
          key={`public-key-${formVersion}`}
          name="publicKey"
          formRef={formRef}
          validators={[validators.required(strings.publicKeyRequired())]}
          multiline
          containerStyle={{
            minHeight: 150,
            alignItems: "flex-start",
            borderRadius: Radius.XS
          }}
          inputStyle={{ height: 140, textAlignVertical: "top" }}
          wrapperStyle={{ minHeight: 150 }}
        />
      </View>

      <View style={{ gap: Spacing.LEVEL_1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
            {strings.privateKey()}
          </Paragraph>
          <Paragraph
            fontSize="XS"
            color={colors.primary.accent}
            fontFamily="SEMI_BOLD"
            onPress={() => pasteInto("privateKey")}
          >
            {strings.paste()}
          </Paragraph>
        </View>
        <FormInput
          key={`private-key-${formVersion}`}
          name="privateKey"
          formRef={formRef}
          validators={[validators.required(strings.privateKeyRequired())]}
          multiline
          containerStyle={{
            minHeight: 150,
            alignItems: "flex-start",
            borderRadius: Radius.XS
          }}
          inputStyle={{ height: 140, textAlignVertical: "top" }}
          wrapperStyle={{ minHeight: 150 }}
        />
      </View>

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
          paddingHorizontal: Spacing.LEVEL_3,
          gap: Spacing.LEVEL_2,
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
          paddingHorizontal: Spacing.LEVEL_3,
          gap: Spacing.LEVEL_2,
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
        width: "100%",
        paddingHorizontal: Spacing.LEVEL_3,
        minHeight: "100%"
      }}
    >
      {apiKeys.length === 0 ? (
        <View
          style={{
            alignItems: "center",
            gap: Spacing.LEVEL_6,
            flex: 1
          }}
        >
          <CirclesBackground size={130}>
            <AppIcon
              name="key"
              iconFamily="notesnook"
              size={22}
              color={colors.static.white}
            />
          </CirclesBackground>

          <View style={{ alignItems: "center", gap: Spacing.LEVEL_4 }}>
            <View
              style={{
                alignItems: "center",
                gap: Spacing.LEVEL_1
              }}
            >
              <Heading
                fontSize="XL"
                lineHeight="100%"
                style={{ textAlign: "center" }}
              >
                {strings.createKey()}
              </Heading>
              <Paragraph
                color={colors.secondary.paragraph}
                style={{ textAlign: "center" }}
              >
                {strings.createFirstApiKey()}
              </Paragraph>
            </View>

            <Button
              title={strings.continue()}
              type="accent"
              style={{
                paddingHorizontal: Spacing.LEVEL_3,
                width: 157
              }}
              onPress={() => {
                AddApiKeySheet.present(() => apiKeysPromise.refresh());
              }}
            />
          </View>
        </View>
      ) : (
        <View style={{ gap: Spacing.LEVEL_3 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Heading fontSize="LG">{strings.viewAPIKeys()}</Heading>

            <Button
              title={strings.createKey()}
              type="accent"
              style={{
                paddingHorizontal: Spacing.LEVEL_2,
                paddingVertical: Spacing.LEVEL_1
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

          {apiKeys.map((key, i) => (
            <>
              <ApiKeyItem
                key={key.key}
                apiKey={key}
                onRevoke={() => apiKeysPromise.refresh()}
                isAtEnd={i === apiKeys.length - 1}
              />

              {apiKeys[i + 1] ? (
                <View
                  style={{
                    width: "100%",
                    borderBottomWidth: 1,
                    borderBottomColor: colors.primary.separator
                  }}
                />
              ) : null}
            </>
          ))}
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

  const revokeKey = () => {
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
  };

  return (
    <View
      style={{
        backgroundColor: colors.secondary.background,
        borderRadius: Radius.S,
        padding: Spacing.LEVEL_2
      }}
    >
      <View style={{ gap: Spacing.LEVEL_1 }}>
        <Heading fontSize="MD" lineHeight="100%">
          {apiKey.name}
        </Heading>

        <View style={{ gap: Spacing.LEVEL_0 }}>
          <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
            {strings.status()}:{" "}
            <Paragraph
              fontSize="XS"
              fontFamily="SEMI_BOLD"
              color={
                isApiKeyExpired ? colors.error.accent : colors.primary.accent
              }
            >
              {apiKey.lastUsedAt
                ? `${strings.lastUsedOn()} ${getFormattedDate(apiKey.lastUsedAt, "date")}`
                : strings.neverUsed()}
            </Paragraph>
          </Paragraph>
          <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
            {strings.created()}:{" "}
            <Paragraph
              fontSize="XS"
              fontFamily="SEMI_BOLD"
              color={colors.primary.paragraph}
            >
              {getFormattedDate(apiKey.dateCreated, "date")}
            </Paragraph>
          </Paragraph>
          <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
            {strings.expires()}:{" "}
            <Paragraph
              fontSize="XS"
              fontFamily="SEMI_BOLD"
              color={
                isApiKeyExpired ? colors.error.accent : colors.primary.paragraph
              }
            >
              {apiKey.expiryDate === -1
                ? strings.never()
                : getFormattedDate(apiKey.expiryDate, "date")}
            </Paragraph>
          </Paragraph>
        </View>
      </View>

      <View
        style={{
          width: "100%",
          height: 1,
          borderBottomWidth: 1,
          borderBottomColor: colors.primary.separator,
          marginVertical: Spacing.LEVEL_3
        }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.LEVEL_1
        }}
      >
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: Spacing.LEVEL_1,
            paddingHorizontal: Spacing.LEVEL_2,
            paddingVertical: Spacing.LEVEL_1,
            backgroundColor: colors.tertiary.background,
            borderRadius: Radius.XS
          }}
        >
          <Paragraph
            numberOfLines={1}
            style={{ flex: 1, fontFamily: "monospace" }}
            fontSize="SM"
            color={colors.primary.paragraph}
          >
            {viewing
              ? apiKey.key
              : `${apiKey.key.slice(0, 10)}${"*".repeat(
                  Math.max(apiKey.key.length - 10, 0)
                )}`}
          </Paragraph>

          {viewing ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.LEVEL_1
              }}
            >
              <Paragraph
                style={{ fontFamily: "monospace", width: 25 }}
                fontSize="XS"
                color={colors.primary.accent}
              >
                {secondsLeft}s
              </Paragraph>
              <IconButton
                name={copied ? "check" : "content-copy"}
                size={AppFontSize.md}
                color={colors.primary.icon}
                onPress={() => copyToClipboard()}
              />
            </View>
          ) : (
            <IconButton
              name="eye-off-outline"
              size={AppFontSize.md}
              color={colors.primary.icon}
              onPress={() => viewKey()}
            />
          )}
        </View>

        <Pressable
          type="tertiary"
          disabled={isRevoking}
          onPress={revokeKey}
          style={{
            width: 36,
            height: 36,
            borderRadius: Radius.XS
          }}
        >
          <AppIcon
            name="trash"
            iconFamily="notesnook"
            size={AppFontSize.md}
            color={colors.error.icon}
          />
        </Pressable>
      </View>
    </View>
  );
}

export { InboxKeysList, ManageInboxKeys };
