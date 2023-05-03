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
import { FeatureBlock } from "./feature";
import { ScrollView } from "react-native-actions-sheet";

export const CompactFeatures = ({
  vertical,
  features = [],
  maxHeight = 600,
  scrollRef
}) => {
  let data = vertical
    ? features
    : [
        {
          highlight: "Everything",
          content: "in basic",
          icon: "emoticon-wink"
        },
        {
          highlight: "Unlimited",
          content: "notebooks",
          icon: "notebook"
        },
        {
          highlight: "File & image",
          content: "attachments",
          icon: "attachment"
        },
        {
          highlight: "Instant",
          content: "syncing",
          icon: "sync"
        },
        {
          highlight: "Private",
          content: "vault",
          icon: "shield"
        },
        {
          highlight: "Daily, weekly & montly",
          content: "recurring reminders",
          icon: "bell"
        },
        {
          highlight: "Rich text",
          content: "editing",
          icon: "square-edit-outline"
        },
        {
          highlight: "PDF & markdown",
          content: "exports",
          icon: "file"
        },
        {
          highlight: "Encrypted",
          content: "backups",
          icon: "backup-restore"
        }
      ];

  return (
    <ScrollView
      horizontal={!vertical}
      showsHorizontalScrollIndicator={false}
      style={{
        width: "100%",
        maxHeight: maxHeight,
        paddingHorizontal: 12
      }}
    >
      {data.map((item) => (
        <FeatureBlock key={item.highlight} vertical={vertical} {...item} />
      ))}
    </ScrollView>
  );
};
