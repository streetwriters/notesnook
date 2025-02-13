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

import React from "react";
import { Platform, View } from "react-native";
import { AppFontSize } from "../../utils/size";
import { Pressable } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import RNIap from "react-native-iap";

export const PricingItem = ({
  product,
  onPress,
  compact,
  strikethrough
}: {
  product: {
    type: "yearly" | "monthly";
    data?: RNIap.Subscription;
    info: string;
    offerType?: "yearly" | "monthly";
  };
  strikethrough?: boolean;
  onPress?: () => void;
  compact?: boolean;
}) => {
  return (
    <Pressable
      onPress={onPress}
      type="secondary"
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: compact ? 15 : 10,
        width: compact ? null : "100%",
        minWidth: 150,
        opacity: strikethrough ? 0.7 : 1
      }}
      disabled={strikethrough}
    >
      {!compact && (
        <View>
          <Heading size={AppFontSize.lg - 2}>
            {product?.type === "yearly" || product?.offerType === "yearly"
              ? "Yearly"
              : "Monthly"}
          </Heading>
          {product?.info && (
            <Paragraph size={AppFontSize.xs}>{product.info}</Paragraph>
          )}
        </View>
      )}

      <View>
        <Paragraph
          style={{
            textDecorationLine: strikethrough ? "line-through" : undefined
          }}
          size={AppFontSize.sm}
        >
          <Heading
            style={{
              textDecorationLine: strikethrough ? "line-through" : undefined
            }}
            size={AppFontSize.lg - 2}
          >
            {Platform.OS === "android"
              ? (product.data as RNIap.SubscriptionAndroid | undefined)
                  ?.subscriptionOfferDetails?.[0]?.pricingPhases
                  .pricingPhaseList?.[0]?.formattedPrice
              : (product.data as RNIap.SubscriptionIOS | undefined)
                  ?.localizedPrice}
          </Heading>
          {product?.type === "yearly" || product?.offerType === "yearly"
            ? "/year"
            : "/month"}
        </Paragraph>
      </View>
    </Pressable>
  );
};
