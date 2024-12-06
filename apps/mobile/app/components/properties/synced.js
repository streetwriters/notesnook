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

import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { useUserStore } from "../../stores/use-user-store";
import { openLinkInBrowser } from "../../utils/functions";
import { SIZE } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { sleep } from "../../utils/time";
import { Button } from "../ui/button";
export const Synced = ({ item, close }) => {
  const { colors } = useThemeColors();
  const user = useUserStore((state) => state.user);
  const lastSynced = useUserStore((state) => state.lastSynced);
  return user && lastSynced >= item.dateModified ? (
    <Button
      style={{
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignSelf: "flex-start",
        height: "auto",
        padding: DefaultAppStyles.GAP_VERTICAL_SMALL,
        paddingHorizontal: DefaultAppStyles.GAP_SMALL
      }}
      fontSize={SIZE.xxxs}
      iconSize={SIZE.xs}
      icon="shield-key-outline"
      type="shade"
      title="Encrypted and synced"
      onPress={async () => {
        try {
          close();
          await sleep(300);
          await openLinkInBrowser(
            "https://help.notesnook.com/how-is-my-data-encrypted",
            colors
          );
        } catch (e) {
          console.error(e);
        }
      }}
    />
  ) : null;
};
