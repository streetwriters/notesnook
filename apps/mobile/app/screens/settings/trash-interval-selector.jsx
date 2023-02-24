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
import { View } from "react-native";
import Menu, { MenuItem } from "react-native-reanimated-material-menu";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import { PressableButton } from "../../components/ui/pressable";
import Paragraph from "../../components/ui/typography/paragraph";
import PremiumService from "../../services/premium";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";

export const TrashIntervalSelector = () => {
  const colors = useThemeStore((state) => state.colors);
  const [trashInterval, setTrashInterval] = useState(
    db.settings.getTrashCleanupInterval()
  );
  const menuRef = useRef();
  const [width, setWidth] = useState(0);
  return (
    <View
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
      }}
      style={{
        width: "100%"
      }}
    >
      <Menu
        ref={menuRef}
        animationDuration={200}
        style={{
          borderRadius: 5,
          backgroundColor: colors.bg,
          width: width,
          marginTop: 60
        }}
        onRequestClose={() => {
          menuRef.current?.hide();
        }}
        anchor={
          <PressableButton
            onPress={async () => {
              await PremiumService.verify(menuRef.current?.show);
            }}
            type="grayBg"
            customStyle={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 10,
              width: "100%",
              justifyContent: "space-between",
              padding: 12
            }}
          >
            <Paragraph>
              {trashInterval === -1 ? "Never" : trashInterval + " days"}
            </Paragraph>
            <Icon color={colors.icon} name="menu-down" size={SIZE.md} />
          </PressableButton>
        }
      >
        {[-1, 7, 30, 365].map(
          (item) =>
            item.name !== "Monographs" && (
              <MenuItem
                key={item.name}
                onPress={async () => {
                  menuRef.current?.hide();
                  setTrashInterval(item);
                  db.settings.setTrashCleanupInterval(item);
                }}
                style={{
                  backgroundColor:
                    trashInterval === item ? colors.nav : "transparent",
                  width: "100%",
                  maxWidth: width
                }}
                textStyle={{
                  fontSize: SIZE.md,
                  color: trashInterval === item ? colors.accent : colors.pri
                }}
              >
                {item === -1 ? "Never" : item + " days"}
              </MenuItem>
            )
        )}
      </Menu>
    </View>
  );
};
