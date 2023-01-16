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

import React, { Fragment } from "react";
import { View } from "react-native";
import { allowedPlatforms } from "../../stores/use-message-store";
import { ProFeatures } from "../dialogs/result/pro-features";
import { Body } from "./body";
import { Cta } from "./cta";
import { Description } from "./description";
import { List } from "./list";
import { Photo } from "./photo";
import { SubHeading } from "./subheading";
import { Title } from "./title";

export function allowedOnPlatform(platforms) {
  if (!platforms) return true;
  return platforms.some((platform) => allowedPlatforms.indexOf(platform) > -1);
}

export const margins = {
  0: 0,
  1: 12,
  2: 20
};

export const getStyle = (style) => {
  if (!style) return {};
  return {
    marginTop: margins[style.marginTop] || 0,
    marginBottom: margins[style.marginBottom] || 0,
    textAlign: style.textAlign || "left"
  };
};

const Features = () => {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        alignItems: "center",
        width: "100%"
      }}
    >
      <ProFeatures />
    </View>
  );
};

const renderItems = {
  title: Title,
  description: Description,
  body: Body,
  text: Body,
  image: Photo,
  list: List,
  subheading: SubHeading,
  features: Features,
  callToActions: Cta
};

export const renderItem = ({ item, index, color, inline }) => {
  const Item = renderItems[item.type] || Fragment;

  return (
    <Item
      key={item.text || item.src || item.type}
      {...item}
      index={index}
      color={color}
      inline={inline}
    />
  );
};
