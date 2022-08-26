import { RefObject, useEffect, useRef } from "react";
import { Platform } from "react-native";
//@ts-ignore
import RNTooltips from "react-native-tooltips";
import { useThemeStore } from "../stores/use-theme-store";
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../services/event-manager";
import { Popup } from "../services/tip-manager";
import useKeyboard from "./use-keyboard";

let currentTargets: number[] = [];
let timers: NodeJS.Timeout[] = [];

/**
 * A function to hide all native tooltips
 */
export const hideAllTooltips = async () => {
  timers.forEach((t) => t && clearTimeout(t));
  for (let target of currentTargets) {
    if (target) {
      console.log("dimissing targets", target);
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
  const colors = useThemeStore((state) => state.colors);
  const parent = useRef();
  let keyboard = useKeyboard();

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
    target: RefObject<any>,
    popup: Popup,
    position: keyof typeof positions,
    duration: number
  ) {
    if (!target?.current || !parent?.current) return;
    target.current && RNTooltips.Dismiss(target.current);
    currentTargets.push(target.current._nativeTag);
    timers[timers.length] = setTimeout(() => {
      //TipManager.markPopupUsed(popup.id);
      console.log("tooltip showing", popup.text);
      RNTooltips.Show(target.current, parent.current, {
        text: popup.text,
        tintColor: colors.night ? colors.nav : "#404040",
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
  }, []);
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
