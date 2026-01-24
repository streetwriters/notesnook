import { usePromise } from "@notesnook/common";
import { db } from "../../common/database";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { Button } from "../../components/ui/button";
import { strings } from "@notesnook/intl";
import Input from "../../components/ui/input";
import { useEffect, useRef, useState } from "react";
import { SerializedKeyPair } from "@notesnook/crypto";
import Paragraph from "../../components/ui/typography/paragraph";
import { DefaultAppStyles } from "../../utils/styles";
import { ToastManager } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { Storage } from "../../common/database/storage";
import { Notice } from "../../components/ui/notice";
import { presentDialog } from "../../components/dialog/functions";
import { useSettingStore } from "../../stores/use-setting-store";
import { InboxApiKey } from "@notesnook/core";
import { IconButton } from "../../components/ui/icon-button";
import Clipboard from "@react-native-clipboard/clipboard";
import { useThemeColors } from "@notesnook/theme";
import dayjs from "dayjs";
import Heading from "../../components/ui/typography/heading";
import { AppFontSize } from "../../utils/size";
import AddApiKeySheet from "../../components/sheets/add-api-key";

const ManageInboxKeys = () => {
  const keys = usePromise(() => db.user.getInboxKeys());
  const keysEdited = useRef<SerializedKeyPair>(undefined);

  if (keys.status === "fulfilled" && keys.value && !keysEdited.current) {
    keysEdited.current = keys.value;
  }

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
      <Input
        defaultValue={keysEdited.current?.publicKey}
        multiline
        onChangeText={(value) => {
          if (keysEdited.current) {
            keysEdited.current.publicKey = value;
          }
        }}
        style={{
          height: 150
        }}
        wrapperStyle={{
          height: 150
        }}
      />
      <Paragraph>{strings.privateKey()}</Paragraph>
      <Input
        defaultValue={keysEdited.current?.privateKey}
        multiline
        onChangeText={(value) => {
          if (keysEdited.current) {
            keysEdited.current.privateKey = value;
          }
        }}
        style={{
          height: 150
        }}
        wrapperStyle={{
          height: 150
        }}
      />
      <Button
        title={strings.save()}
        type="accent"
        width={"100%"}
        onPress={async () => {
          try {
            if (keysEdited.current) {
              const valid = await Storage.validatePGPKeyPair(
                keysEdited.current
              );

              if (!valid) {
                ToastManager.show({
                  message: strings.invalidPgpKeyPair(),
                  type: "error"
                });
                return;
              }

              presentDialog({
                title: strings.areYouSure(),
                paragraph: strings.changingInboxPgpKeysNotice(),
                positiveText: strings.yes(),
                negativeText: strings.no(),
                positivePress: async () => {
                  db.user?.saveInboxKeys(keysEdited.current!);
                  ToastManager.show({
                    message: strings.inboxKeysSaved(),
                    type: "success"
                  });
                  Navigation.goBack();
                  return true;
                }
              });
            }
          } catch (e) {
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
        paddingBottom: 50
      }}
    >
      {apiKeys.length === 0 ? (
        <View
          style={{
            padding: DefaultAppStyles.GAP * 2,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.secondary.border,
            borderRadius: 5,
            backgroundColor: colors.secondary.background,
            alignItems: "center"
          }}
        >
          <Paragraph color={colors.secondary.paragraph}>
            {strings.createFirstApiKey()}
          </Paragraph>
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

  const isApiKeyExpired = Date.now() > apiKey.expiryDate;

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
                color={colors.static.white}
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

export { ManageInboxKeys, InboxKeysList };
