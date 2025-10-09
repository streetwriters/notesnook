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

import { RefObject, useEffect, useRef } from "react";
import { Platform } from "react-native";
//@ts-ignore
import RNTooltips from "react-native-tooltips";
import { useThemeColors } from "@notesnook/theme";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../services/event-manager";
import { Popup } from "../services/tip-manager";
import useKeyboard from "./use-keyboard";

let currentTargets: number[] = [];
const timers: NodeJS.Timeout[] = [];

/**
 * A function to hide all native tooltips
 */
export const hideAllTooltips = async () => {
  timers.forEach((t) => t && clearTimeout(t));
  for (let target of currentTargets) {
    if (target) {
      RNTooltips.Dismiss(target);
      target = -1;
    }
  }
  currentTargets = [];
};

/**
 * A hook that is used to show/hide tooltips on render
 * @returns
 */
const useTooltip = () => {
  const { colors, isDark } = useThemeColors();
  const parent = useRef();
  const keyboard = useKeyboard();

  useEffect(() => {
    hideAllTooltips();
  }, [keyboard.keyboardShown]);

  const positions = {
    left: 1,
    right: 2,
    top: 3,
    bottom: 4
  };

  function show(
    target: RefObject<{ _nativeTag: number }>,
    popup: Popup,
    position: keyof typeof positions,
    duration: number
  ) {
    if (!target?.current || !parent?.current) return;
    target.current && RNTooltips.Dismiss(target.current);
    currentTargets.push(target.current._nativeTag);
    timers[timers.length] = setTimeout(() => {
      //TipManager.markPopupUsed(popup.id);
      RNTooltips.Show(target.current, parent.current, {
        text: popup.text(),
        tintColor: isDark ? colors.secondary.background : "#404040",
        corner: Platform.OS === "ios" ? 5 : 50,
        textSize: 15,
        position: positions[position],
        duration: duration || 10000,
        clickToHide: true,
        shadow: true,
        autoHide: true
      });
    }, 1000);
  }

  return { parent, show };
};

type TTooltipIdentifiers =
  | "sectionheader"
  | "searchreplace"
  | "notebookshortcut";

/**
 * A hook that helps in listening to tooltip show/hide requests and respond.
 */
export const useTooltipHandler = (
  id: TTooltipIdentifiers,
  callback: () => void
) => {
  useEffect(() => {
    if (!id) return;
    eSubscribeEvent(id, callback);
    return () => {
      eUnSubscribeEvent(id, callback);
    };
  }, [callback, id]);
  return null;
};

/**
 * A function to present a tooltip from anywhere in the app.
 * @param id
 */
useTooltip.present = (id: TTooltipIdentifiers) => {
  eSendEvent(id);
};

export default useTooltip;
