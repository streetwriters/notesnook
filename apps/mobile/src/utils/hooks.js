import { useEffect, useState,useCallback } from 'react';
import { useTracked } from '../provider';
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../services/eventManager';
import { eScrollEvent } from '../services/events';



export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);
  return update;
}

export function useHideHeader() {
  const [hide,setHide] = useState(false);
  const [state, dispatch] = useTracked();
  const {
    searchResults,
  } = state;
  let offsetY = 0;
  let timeout = null;

  const onScroll = (y) => {
    if (searchResults.results.length > 0) return;
    if (y < 30) {
      setHide(false);
      offsetY = y;
    }
    if (y > offsetY) {
      if (y - offsetY < 100) return;
      clearTimeout(timeout);
      timeout = null;
      timeout = setTimeout(() => {
        setHide(true);
      }, 300);
      offsetY = y;
    } else {
      if (offsetY - y < 50) return;
      clearTimeout(timeout);
      timeout = null;
      timeout = setTimeout(() => {
        setHide(false);
      }, 300);
      offsetY = y;
    }
  };

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  }, []);
 console.log('used',hide)
  return hide;

}
