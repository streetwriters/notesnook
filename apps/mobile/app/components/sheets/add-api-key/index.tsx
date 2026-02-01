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
import React, { useRef, useState } from "react";
import { View, ScrollView } from "react-native";
import { strings } from "@notesnook/intl";
import { db } from "../../../common/database";
import { Button } from "../../ui/button";
import Input from "../../ui/input";
import Paragraph from "../../ui/typography/paragraph";
import Heading from "../../ui/typography/heading";
import { DefaultAppStyles } from "../../../utils/styles";
import { AppFontSize } from "../../../utils/size";
import { ToastManager, presentSheet } from "../../../services/event-manager";
import { useThemeColors } from "@notesnook/theme";
import { Pressable } from "../../ui/pressable";

const getExpiryOptions = () => [
  { label: strings.expiryOneDay(), value: 24 * 60 * 60 * 1000 },
  { label: strings.expiryOneWeek(), value: 7 * 24 * 60 * 60 * 1000 },
  { label: strings.expiryOneMonth(), value: 30 * 24 * 60 * 60 * 1000 },
  { label: strings.expiryOneYear(), value: 365 * 24 * 60 * 60 * 1000 },
  { label: strings.never(), value: -1 }
];

type AddApiKeySheetProps = {
  close?: (ctx?: string | undefined) => void;
  onAdd: () => void;
};

export default function AddApiKeySheet({ close, onAdd }: AddApiKeySheetProps) {
  const { colors } = useThemeColors();
  const keyNameRef = useRef<string>("");
  const [selectedExpiry, setSelectedExpiry] = useState(
    getExpiryOptions()[2].value
  );
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      if (!keyNameRef.current || !keyNameRef.current.trim()) {
        ToastManager.show({
          message: strings.enterKeyName(),
          type: "error"
        });
        return;
      }

      setIsCreating(true);
      await db.inboxApiKeys.create(keyNameRef.current, selectedExpiry);
      ToastManager.show({
        message: strings.apiKeyCreatedSuccessfully(),
        type: "success"
      });
      onAdd();
      close?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      ToastManager.show({
        message: strings.failedToCreateApiKey(message),
        type: "error"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: DefaultAppStyles.GAP,
        gap: DefaultAppStyles.GAP_VERTICAL,
        paddingTop: DefaultAppStyles.GAP_VERTICAL,
        paddingBottom: DefaultAppStyles.GAP_VERTICAL * 2
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Heading size={AppFontSize.xl}>{strings.createApiKey()}</Heading>
      </View>

      <View style={{ gap: DefaultAppStyles.GAP_VERTICAL }}>
        <Paragraph size={AppFontSize.sm}>{strings.keyName()}</Paragraph>
        <Input
          placeholder={strings.exampleKeyName()}
          onChangeText={(text) => {
            keyNameRef.current = text;
          }}
        />
      </View>

      <View style={{ gap: DefaultAppStyles.GAP_VERTICAL }}>
        <Paragraph size={AppFontSize.sm}>{strings.expiresIn()}</Paragraph>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: DefaultAppStyles.GAP_SMALL
          }}
        >
          {getExpiryOptions().map((option) => (
            <Pressable
              key={option.label}
              onPress={() => setSelectedExpiry(option.value)}
              type={
                selectedExpiry === option.value ? "selected" : "transparent"
              }
              style={{
                paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
                paddingHorizontal: DefaultAppStyles.GAP
              }}
            >
              <Paragraph
                size={AppFontSize.sm}
                color={
                  selectedExpiry === option.value
                    ? colors.selected.paragraph
                    : colors.primary.paragraph
                }
              >
                {option.label}
              </Paragraph>
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        title={isCreating ? strings.creating() : strings.create()}
        type="accent"
        width="100%"
        loading={isCreating}
        disabled={isCreating}
        onPress={handleCreate}
        style={{
          marginTop: DefaultAppStyles.GAP_VERTICAL
        }}
      />
    </ScrollView>
  );
}

AddApiKeySheet.present = (onAdd: () => void) => {
  presentSheet({
    component: (ref, close, update) => (
      <AddApiKeySheet close={close} onAdd={onAdd} />
    )
  });
};
