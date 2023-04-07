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
import { View } from "react-native";
import { SIZE } from "../../utils/size";
import { PressableButton } from "../ui/pressable";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

export const PricingItem = ({ product, onPress, compact }) => {
  return (
    <PressableButton
      onPress={onPress}
      type="grayBg"
      customStyle={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: compact ? 15 : 10,
        width: compact ? null : "100%",
        minWidth: 150
      }}
    >
      {!compact && (
        <View>
          <Heading size={SIZE.lg - 2}>
            {product?.type === "yearly" || product?.offerType === "yearly"
              ? "Yearly"
              : "Monthly"}
          </Heading>
          {product?.info && (
            <Paragraph size={SIZE.xs}>{product.info}</Paragraph>
          )}
        </View>
      )}

      <View>
        <Paragraph size={SIZE.sm}>
          <Heading size={SIZE.lg - 2}>{product?.data?.localizedPrice}/</Heading>
          {product?.type === "yearly" || product?.offerType === "yearly"
            ? "/year"
            : "/month"}
        </Paragraph>
      </View>
    </PressableButton>
  );
};
