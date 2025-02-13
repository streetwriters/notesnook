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
import { Button } from "../../components/ui/button";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";

export const FilterBar = () => {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: DefaultAppStyles.GAP,
        width: "93%",
        alignSelf: "center"
      }}
    >
      {[
        {
          name: "All"
        },
        {
          name: "Favorites"
        }
      ].map((item) => (
        <Button
          key={item.name}
          title={item.name}
          type="secondary"
          style={{
            height: 25
          }}
        />
      ))}
      <Button
        key="add"
        icon="plus"
        type="secondary"
        iconSize={AppFontSize.md}
        style={{
          height: 25
        }}
      />
    </View>
  );
};
