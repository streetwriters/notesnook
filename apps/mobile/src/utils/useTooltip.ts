import { RefObject, useEffect, useRef } from 'react';
//@ts-ignore
import RNTooltips from 'react-native-tooltips';
import { useTracked } from '../provider';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../services/EventManager';
import { useKeyboard } from './use-keyboard';

let currentTargets: number[] = [];

export const hideAllTooltips = async () => {
  for (let target of currentTargets) {
    if (target) {
      console.log('dimissing targets', target);
      RNTooltips.Dismiss(target);
      target = -1;
    }
  }
  currentTargets = [];
};

const useTooltip = () => {
  const [state, dispatch] = useTracked();
  const { colors } = state;
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
    text: string,
    position: keyof typeof positions,
    duration: number
  ) {
    if (!target?.current || !parent?.current) return;
    target.current && RNTooltips.Dismiss(target.current);
    currentTargets.push(target.current._nativeTag);
    RNTooltips.Show(target.current, parent.current, {
      text: text,
      tintColor: colors.night ? colors.nav : '#404040',
      corner: 80,
      textSize: 15,
      position: positions[position],
      duration: duration || 10000,
      clickToHide: true,
      shadow: true
    });
  }

  return { parent, show };
};

type TTooltipIdentifiers = 'sectionheader' | 'searchreplace';

export const useTooltipHandler = (id: TTooltipIdentifiers, callback: () => void) => {
  useEffect(() => {
    eSubscribeEvent(id, callback);
    return () => {
      eUnSubscribeEvent(id, callback);
    };
  }, []);
};

useTooltip.present = (id: TTooltipIdentifiers) => {
  eSendEvent(id);
};

export default useTooltip;
