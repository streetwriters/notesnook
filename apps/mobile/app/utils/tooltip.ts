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
import { findNodeHandle, NativeModules, Platform } from "react-native";
import { fluidTabsRef } from "./global-refs";
import { AppFontSize } from "./size";

const { RNTooltips } = NativeModules;

type TooltipShowOptions = {
  text: string;
  position: number;
  align: number;
  autoHide: boolean;
  duration: number;
  clickToHide: boolean;
  corner: number;
  tintColor: string;
  textColor: string;
  textSize: number;
  gravity: number;
  arrow: boolean;
  shadow: boolean;
  onHide: () => void;
};

class Tooltips {
  static POSITION: {
    LEFT: 1;
    RIGHT: 2;
    TOP: 3;
    BOTTOM: 4;
  };

  static ALIGN: {
    START: 1;
    CENTER: 2;
    END: 3;
  };

  static GRAVITY: {
    START: 1;
    CENTER: 2;
    END: 3;
  };

  static defaultProps = {
    text: "",
    position: 4,
    align: 2,
    autoHide: true,
    duration: Platform.OS === "android" ? 4000 : 4,
    clickToHide: false,
    corner: Platform.OS === "android" ? 30 : 0,
    tintColor: "#1F7C82",
    textColor: "#FFFFFF",
    textSize: 12,
    gravity: 2,
    arrow: true,
    shadow: true
  };

  static Show(target: any, parent: any, props: Partial<TooltipShowOptions>) {
    if (typeof target !== "number") {
      target = findNodeHandle(target);
    }
    if (typeof parent !== "number") {
      parent = findNodeHandle(parent);
    }

    if (props.text === undefined) {
      props.text = Tooltips.defaultProps.text;
    }
    if (props.position === undefined) {
      props.position = Tooltips.defaultProps.position;
    }
    if (props.align === undefined) {
      props.align = Tooltips.defaultProps.align;
    }
    if (props.autoHide === undefined) {
      props.autoHide = Tooltips.defaultProps.autoHide;
    }
    if (props.duration === undefined) {
      props.duration = Tooltips.defaultProps.duration;
    }
    if (props.clickToHide === undefined) {
      props.clickToHide = Tooltips.defaultProps.clickToHide;
    }
    if (props.corner === undefined) {
      props.corner = Tooltips.defaultProps.corner;
    }
    if (props.tintColor === undefined) {
      props.tintColor = Tooltips.defaultProps.tintColor;
    }
    if (props.textColor === undefined) {
      props.textColor = Tooltips.defaultProps.textColor;
    }
    if (props.textSize === undefined) {
      props.textSize = Tooltips.defaultProps.textSize;
    }
    if (props.gravity === undefined) {
      props.gravity = Tooltips.defaultProps.gravity;
    }
    if (props.shadow === undefined) {
      props.shadow = Tooltips.defaultProps.shadow;
    }
    if (props.arrow === undefined) {
      props.arrow = Tooltips.defaultProps.arrow;
    }

    RNTooltips.Show(target, parent, props, () => {
      props.onHide && props.onHide();
    });
  }

  static Dismiss(target: any) {
    if (typeof target !== "number") {
      target = findNodeHandle(target);
    }

    RNTooltips.Dismiss(target);
  }
}

export const POSITIONS = {
  LEFT: 1,
  RIGHT: 2,
  TOP: 3,
  BOTTOM: 4
};
let prevTarget: any = null;
function show(event: any, text: string, position = 2) {
  if (!event.target) return;
  prevTarget && Tooltips.Dismiss(prevTarget);
  prevTarget = null;
  prevTarget = event.target;

  Tooltips.Show(prevTarget, fluidTabsRef.current?.node.current, {
    text: text,
    tintColor: "#000000",
    corner: Platform.OS === "ios" ? 5 : 40,
    textSize: AppFontSize.md,
    position: position,
    duration: 2000,
    autoHide: true,
    clickToHide: true,
    shadow: true
  });
}

const NativeTooltip = {
  show,
  POSITIONS
};

export default NativeTooltip;
