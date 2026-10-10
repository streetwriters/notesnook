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
import React, { useRef, useState } from "react";
import { View } from "react-native";
import { ScrollView } from "react-native-actions-sheet";
import { Radius, Spacing } from "../../../common/design/spacing";
import { db } from "../../../common/database";
import { ToastManager, presentSheet } from "../../../services/event-manager";
import { DefaultAppStyles } from "../../../utils/styles";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import FormInput, {
  createFormRef,
  validators
} from "../../ui/input/form-input";
import { Pressable } from "../../ui/pressable";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

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
  const formRef = useRef(
    createFormRef({
      keyName: ""
    })
  );
  const [selectedExpiry, setSelectedExpiry] = useState(
    getExpiryOptions()[2].value
  );
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      if (formRef.current.validateField("keyName")) {
        return;
      }

      const keyName = formRef.current.getValue("keyName").trim();

      setIsCreating(true);
      await db.inboxApiKeys.create(keyName, selectedExpiry);
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
      formRef.current.setError(
        "keyName",
        message || strings.failedToCreateApiKey("")
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: DefaultAppStyles.GAP,
        gap: DefaultAppStyles.GAP,
        paddingTop: DefaultAppStyles.GAP_VERTICAL,
        paddingBottom: DefaultAppStyles.GAP_VERTICAL * 2
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: DefaultAppStyles.GAP_SMALL
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: Radius.XS,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.secondary.background
          }}
        >
          <AppIcon
            name="key"
            iconFamily="notesnook"
            size={16}
            color={colors.primary.icon}
          />
        </View>
        <View style={{ flex: 1, gap: DefaultAppStyles.GAP_VERTICAL_SMALL }}>
          <Heading fontSize="XL" lineHeight="100%">
            {strings.createApiKey()}
          </Heading>
          <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
            {strings.createApiKeyDesc()}
          </Paragraph>
        </View>
      </View>

      <FormInput
        name="keyName"
        formRef={formRef}
        label={strings.keyName()}
        placeholder={strings.exampleKeyName()}
        validators={[validators.required(strings.enterKeyName())]}
        containerStyle={{ borderRadius: Radius.XS }}
        onChangeText={() => {
          formRef.current.setError("keyName", undefined);
        }}
        onSubmitEditing={handleCreate}
      />

      <View style={{ height: 1, backgroundColor: colors.primary.border }} />

      <View style={{ gap: DefaultAppStyles.GAP_VERTICAL }}>
        <Heading fontSize="MD" lineHeight="100%">
          {strings.expiresIn()}
        </Heading>
        <View style={{ gap: DefaultAppStyles.GAP_VERTICAL }}>
          {getExpiryOptions().map((option) => {
            const selected = selectedExpiry === option.value;
            return (
              <Pressable
                key={option.label}
                onPress={() => setSelectedExpiry(option.value)}
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
                    selected ? colors.selected.heading : colors.secondary.heading
                  }
                >
                  {option.label}
                </Heading>
                <AppIcon
                  name={selected ? "radiobox-marked" : "radiobox-blank"}
                  size={16}
                  color={selected ? colors.selected.accent : colors.secondary.icon}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        title={isCreating ? strings.creating() : strings.create()}
        type="accent"
        width="100%"
        loading={isCreating}
        disabled={isCreating}
        onPress={handleCreate}
      />
    </ScrollView>
  );
}

AddApiKeySheet.present = (onAdd: () => void) => {
  presentSheet({
    component: (ref, close, _update) => (
      <AddApiKeySheet close={close} onAdd={onAdd} />
    )
  });
};
