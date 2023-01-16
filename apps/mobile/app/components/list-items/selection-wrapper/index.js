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

import React, { useEffect, useState } from "react";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../../services/event-manager";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useThemeStore } from "../../../stores/use-theme-store";
import { history } from "../../../utils";
import { PressableButton } from "../../ui/pressable";
import { ActionStrip } from "./action-strip";
import { Filler } from "./back-fill";
import { SelectionIcon } from "./selection";
import { useRef } from "react";

const SelectionWrapper = ({
  children,
  item,
  background,
  onLongPress,
  onPress,
  testID,
  isSheet
}) => {
  const itemId = useRef(item.id);
  const colors = useThemeStore((state) => state.colors);
  const [actionStrip, setActionStrip] = useState(false);
  const notebooksListMode = useSettingStore(
    (state) => state.settings.notebooksListMode
  );
  const notesListMode = useSettingStore(
    (state) => state.settings.notesListMode
  );
  const listMode = item.type === "notebook" ? notebooksListMode : notesListMode;
  const compactMode =
    (item.type === "notebook" || item.type === "note") &&
    listMode === "compact";

  if (item.id !== itemId.current) {
    itemId.current = item.id;
    if (actionStrip) {
      setActionStrip(false);
    }
  }

  const _onLongPress = () => {
    if (history.selectedItemsList.length > 0) return;
    setActionStrip(!actionStrip);
  };

  const _onPress = async () => {
    if (actionStrip) {
      setActionStrip(false);
      return;
    }
    await onPress();
  };

  const closeStrip = () => {
    setActionStrip(false);
  };

  useEffect(() => {
    eSubscribeEvent("navigate", closeStrip);

    return () => {
      eUnSubscribeEvent("navigate", closeStrip);
    };
  }, []);
  return (
    <PressableButton
      customColor={isSheet ? colors.transGray : "transparent"}
      testID={testID}
      onLongPress={_onLongPress}
      onPress={_onPress}
      customSelectedColor={colors.transGray}
      customAlpha={!colors.night ? -0.02 : 0.02}
      customOpacity={1}
      customStyle={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        overflow: "hidden",
        paddingHorizontal: 12,
        paddingVertical: compactMode ? 8 : 12,
        borderRadius: isSheet ? 10 : 0,
        marginBottom: isSheet ? 12 : undefined
      }}
    >
      {item.type === "note" ? (
        <Filler background={background} item={item} />
      ) : null}
      <SelectionIcon
        compactMode={compactMode}
        setActionStrip={setActionStrip}
        item={item}
        onLongPress={onLongPress}
      />
      {children}

      {actionStrip ? (
        <ActionStrip note={item} setActionStrip={setActionStrip} />
      ) : null}
    </PressableButton>
  );
};

export default SelectionWrapper;
