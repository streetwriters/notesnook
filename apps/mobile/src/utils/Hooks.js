import { useEffect, useState,useCallback } from 'react';
import { useTracked } from '../provider';
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../services/EventManager';
import { eScrollEvent } from './Events';



export function useForceUpdate() {
  const [, setTick] = useState(0);
  const update = useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);
  return update;
}

