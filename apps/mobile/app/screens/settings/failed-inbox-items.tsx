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
import { InboxItemsHistoryErrorContext } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { db } from "../../common/database";
import { presentDialog } from "../../components/dialog/functions";
import { Button } from "../../components/ui/button";
import { IconButton } from "../../components/ui/icon-button";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastManager } from "../../services/event-manager";
import { AppFontSize, defaultBorderRadius } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { Header } from "../../components/header";

type FailedInboxItem = {
  id: string;
  dateSynced: number;
  errorContext?: string;
};

function parseErrorContext(
  raw: string | undefined
): InboxItemsHistoryErrorContext | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as InboxItemsHistoryErrorContext;
  } catch {
    return null;
  }
}

function ErrorBadge({
  message
}: {
  message: InboxItemsHistoryErrorContext["message"] | undefined;
}) {
  const { colors } = useThemeColors();

  if (!message) {
    return (
      <Paragraph size={AppFontSize.xs} color={colors.secondary.paragraph}>
        N/A
      </Paragraph>
    );
  }

  const palette =
    message === "Invalid JSON"
      ? { background: "rgba(255, 152, 0, 0.15)", paragraph: "#e65100" }
      : message === "Validation failed"
        ? { background: "rgba(255, 193, 7, 0.15)", paragraph: "#8a6000" }
        : colors.error;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: palette.background,
        borderRadius: defaultBorderRadius,
        paddingVertical: 4,
        paddingHorizontal: 8
      }}
    >
      <Paragraph
        size={AppFontSize.xxs}
        color={palette.paragraph}
        style={{ fontWeight: "700" }}
      >
        {message}
      </Paragraph>
    </View>
  );
}

function DetailsBlock({ value }: { value: string }) {
  const { colors } = useThemeColors();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1000);
    return () => clearTimeout(timeout);
  }, [copied]);

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.secondary.border,
        borderRadius: defaultBorderRadius,
        backgroundColor: colors.secondary.background,
        overflow: "hidden"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          borderBottomWidth: 1,
          borderBottomColor: colors.secondary.border
        }}
      >
        <IconButton
          name={copied ? "check" : "content-copy"}
          color={colors.primary.icon}
          size={AppFontSize.lg}
          onPress={() => {
            try {
              Clipboard.setString(value);
              setCopied(true);
              ToastManager.show({
                message: strings.copied(),
                type: "success"
              });
            } catch {
              ToastManager.show({
                message: strings.failedToCopyToClipboard(),
                type: "error"
              });
            }
          }}
        />
      </View>

      <ScrollView
        style={{ maxHeight: 120 }}
        contentContainerStyle={{
          padding: DefaultAppStyles.GAP_SMALL
        }}
      >
        <Paragraph
          size={AppFontSize.xxs}
          style={{
            fontFamily: "monospace"
          }}
        >
          {value}
        </Paragraph>
      </ScrollView>
    </View>
  );
}

export const FailedInboxItems = () => {
  const { colors } = useThemeColors();
  const result = usePromise(() => db.inboxItemsHistory.failed.items());

  async function deleteItem(id: string) {
    await db.inboxItemsHistory.delete(id);
    ToastManager.show({
      message: strings.itemDeleted(),
      type: "success"
    });

    if (result.status !== "pending") {
      result.refresh();
    }
  }

  const items = (
    result.status === "fulfilled" ? result.value : []
  ) as FailedInboxItem[];

  return (
    <View
      style={{
        flex: 1
      }}
    >
      <Header
        renderedInRoute="Settings"
        title={strings.failedInboxItems()}
        canGoBack={true}
        id="Settings"
        rightButton={
          items?.length > 0
            ? {
                name: "delete",
                color: colors.primary.icon,
                onPress: async () => {
                  presentDialog({
                    title: strings.deleteAll(),
                    paragraph: strings.deleteAllFailedItemsDesc(),
                    positiveText: strings.delete(),
                    positiveType: "errorShade",
                    positivePress: async () => {
                      if (result.status !== "pending") {
                        await db.inboxItemsHistory.deleteFailed();
                        result.refresh();
                      }

                      return true;
                    }
                  });
                }
              }
            : undefined
        }
      />

      {result.status === "pending" ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: DefaultAppStyles.GAP_VERTICAL
          }}
        >
          <ActivityIndicator size="small" color={colors.primary.accent} />
          <Paragraph color={colors.secondary.paragraph}>
            {strings.loading()}
          </Paragraph>
        </View>
      ) : null}

      {result.status === "rejected" ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: DefaultAppStyles.GAP_VERTICAL,
            paddingHorizontal: DefaultAppStyles.GAP
          }}
        >
          <Paragraph color={colors.error.paragraph}>
            {strings.failed()}
          </Paragraph>
          <Button
            title={strings.retry()}
            type="accent"
            onPress={result.refresh}
          />
        </View>
      ) : null}

      {items.length === 0 ? (
        <View
          style={{
            paddingHorizontal: DefaultAppStyles.GAP,
            paddingTop: DefaultAppStyles.GAP_VERTICAL,
            flex: 1,
            justifyContent: "center"
          }}
        >
          <View
            style={{
              padding: DefaultAppStyles.GAP,
              borderRadius: defaultBorderRadius,
              alignItems: "center"
            }}
          >
            <Paragraph color={colors.secondary.paragraph}>
              {strings.noFailedInboxItems()}
            </Paragraph>
          </View>
        </View>
      ) : null}

      {result.status === "fulfilled" && items.length > 0 ? (
        <ScrollView
          contentContainerStyle={{
            gap: DefaultAppStyles.GAP_VERTICAL,
            paddingHorizontal: DefaultAppStyles.GAP,
            paddingVertical: DefaultAppStyles.GAP_VERTICAL,
            paddingBottom: 50
          }}
        >
          {items.map((item) => {
            const context = parseErrorContext(item.errorContext);
            const { message, description, ...rest } =
              context ??
              ({} as Partial<InboxItemsHistoryErrorContext> &
                Record<string, unknown>);
            const details =
              Object.keys(rest).length > 0
                ? JSON.stringify(rest, null, 2)
                : undefined;

            return (
              <View
                key={item.id}
                style={{
                  borderWidth: 1,
                  borderColor: colors.secondary.border,
                  borderRadius: defaultBorderRadius,
                  backgroundColor: colors.primary.background,
                  padding: DefaultAppStyles.GAP,
                  gap: DefaultAppStyles.GAP_VERTICAL
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between"
                  }}
                >
                  <Paragraph
                    size={AppFontSize.xs}
                    color={colors.secondary.paragraph}
                  >
                    {getFormattedDate(item.dateSynced, "date-time")}
                  </Paragraph>

                  <ErrorBadge message={message} />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    gap: DefaultAppStyles.GAP_SMALL,
                    alignItems: "flex-start"
                  }}
                >
                  <View
                    style={{
                      backgroundColor: colors.error.background,
                      padding: 3,
                      paddingHorizontal: 6,
                      borderRadius: 4,
                      alignItems: "center",
                      flexWrap: "wrap"
                    }}
                  >
                    <Paragraph color={colors.error.paragraph}>Error</Paragraph>
                  </View>
                  <Paragraph
                    style={{
                      flexShrink: 1
                    }}
                  >
                    {(description as string) || "N/A"}
                  </Paragraph>
                </View>

                {details ? (
                  <DetailsBlock value={details} />
                ) : (
                  <Paragraph
                    size={AppFontSize.xs}
                    color={colors.secondary.paragraph}
                  >
                    N/A
                  </Paragraph>
                )}

                <View style={{ alignItems: "flex-end" }}>
                  <Button
                    title={strings.delete()}
                    type="error"
                    style={{
                      width: "100%"
                    }}
                    onPress={() => {
                      presentDialog({
                        title: strings.delete(),
                        paragraph: strings.areYouSure(),
                        positiveText: strings.delete(),
                        positiveType: "error",
                        negativeText: strings.cancel(),
                        positivePress: async () => {
                          try {
                            await deleteItem(item.id);
                            return true;
                          } catch (error) {
                            ToastManager.error(error as Error);
                            return false;
                          }
                        }
                      });
                    }}
                  />
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
};
