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
import { FontSizes } from "../../common/design/font";
import { Radius, Spacing } from "../../common/design/spacing";
import { db } from "../../common/database";
import { presentDialog } from "../../components/dialog/functions";
import { Header } from "../../components/header";
import AppIcon from "../../components/ui/AppIcon";
import { Button } from "../../components/ui/button";
import { Pressable } from "../../components/ui/pressable";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastManager } from "../../services/event-manager";
import LineSeparator from "../../components/ui/seperator/line-separator";

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

function PayloadDataBlock({ value }: { value: string }) {
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
        backgroundColor: colors.secondary.background,
        borderRadius: Radius.S,
        padding: Spacing.LEVEL_2,
        gap: Spacing.LEVEL_2,
        width: "100%"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%"
        }}
      >
        <Heading fontSize="MD" lineHeight="100%">
          {strings.payloadData()}
        </Heading>

        <Pressable
          type="transparent"
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
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.LEVEL_1,
            paddingVertical: 0,
            paddingHorizontal: 0,

            flexShrink: 1,
            width: undefined
          }}
        >
          <AppIcon
            name={copied ? "check" : "copy"}
            iconFamily={"notesnook"}
            size={16}
            color={colors.primary.accent}
          />
          <Paragraph
            fontFamily="MEDIUM"
            fontSize="SM"
            color={colors.primary.accent}
          >
            {strings.copy()}
          </Paragraph>
        </Pressable>
      </View>

      <View style={{ height: 1, backgroundColor: colors.primary.separator }} />

      <View
        style={{
          backgroundColor: colors.tertiary.background,
          borderRadius: Radius.S,
          padding: Spacing.LEVEL_2,
          width: "100%"
        }}
      >
        <ScrollView
          style={{ maxHeight: 160, width: "100%" }}
          nestedScrollEnabled
        >
          <Paragraph
            fontSize="SM"
            color={colors.primary.paragraph}
            style={{ fontFamily: "monospace" }}
          >
            {value}
          </Paragraph>
        </ScrollView>
      </View>
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
        style={{
          backgroundColor: "transparent"
        }}
        rightButton={
          items?.length > 0
            ? {
                name: "trash",
                iconFamily: "notesnook",
                size: 20,
                color: colors.primary.icon,
                onPress: async () => {
                  presentDialog({
                    title: strings.deleteAll(),
                    paragraph: strings.deleteAllFailedItemsDesc(),
                    positiveText: strings.delete(),
                    positiveType: "error-shade-outline",
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

      <LineSeparator paddingHorizontal={Spacing.LEVEL_3} />

      {result.status === "pending" ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: Spacing.LEVEL_2
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
            gap: Spacing.LEVEL_2,
            paddingHorizontal: Spacing.LEVEL_3
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
            paddingHorizontal: Spacing.LEVEL_3,
            paddingTop: Spacing.LEVEL_2,
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Paragraph color={colors.secondary.paragraph}>
            {strings.noFailedInboxItems()}
          </Paragraph>
        </View>
      ) : null}

      {result.status === "fulfilled" && items.length > 0 ? (
        <ScrollView
          contentContainerStyle={{
            gap: Spacing.LEVEL_4,
            paddingHorizontal: Spacing.LEVEL_3,
            paddingVertical: Spacing.LEVEL_4,
            paddingBottom: 50,
            paddingTop: Spacing.LEVEL_3
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
                  gap: Spacing.LEVEL_3,
                  width: "100%"
                }}
              >
                <View style={{ gap: Spacing.LEVEL_2, width: "100%" }}>
                  <View style={{ gap: Spacing.LEVEL_1, width: "100%" }}>
                    <Heading fontSize="LG" lineHeight="100%">
                      {(message as string) || strings.failed()}
                    </Heading>
                    {description ? (
                      <Paragraph fontSize="SM" color={colors.primary.paragraph}>
                        {description as string}
                      </Paragraph>
                    ) : null}
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.LEVEL_0 + 2
                    }}
                  >
                    <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
                      {getFormattedDate(item.dateSynced, "date")}
                    </Paragraph>
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: Radius.MD,
                        backgroundColor: colors.secondary.paragraph
                      }}
                    />
                    <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
                      {getFormattedDate(item.dateSynced, "time")}
                    </Paragraph>
                  </View>
                </View>

                {details ? <PayloadDataBlock value={details} /> : null}

                <Button
                  title={strings.delete()}
                  type="error"
                  fontSize={FontSizes.MD}
                  style={{
                    width: "100%",
                    borderWidth: 1,
                    borderColor: colors.error.border,
                    borderRadius: Radius.XS,
                    paddingVertical: Spacing.LEVEL_3
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
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
};
