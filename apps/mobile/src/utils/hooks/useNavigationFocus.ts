import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SettingsService from '../../services/settings';
import useNavigationStore from '../../stores/use-navigation-store';

type NavigationFocus = {
  onFocus?: (prev: RefObject<boolean>) => boolean;
  onBlur?: (prev: RefObject<boolean>) => boolean;
  delay?: number;
  focusOnInit?: boolean;
};

export const useNavigationFocus = (
  navigation: NativeStackNavigationProp<any>,
  { onFocus, onBlur, delay, focusOnInit }: NavigationFocus
) => {
  const [isFocused, setFocused] = useState(focusOnInit);
  const prev = useRef(false);

  const _onFocus = useCallback(() => {
    setTimeout(() => {
      console.log('on focus', prev);
      let shouldFocus = onFocus ? onFocus(prev) : true;
      if (shouldFocus) {
        setFocused(true);
        prev.current = true;
      }
    }, delay || 300);
  }, [onFocus, prev]);

  const _onBlur = useCallback(() => {
    setTimeout(() => {
      let shouldBlur = onBlur ? onBlur(prev) : true;
      if (shouldBlur) {
        prev.current = false;
        setFocused(false);
      }
    }, delay || 300);
  }, [onBlur, prev]);

  useEffect(() => {
    if (!navigation) return;
    const subs = [
      navigation.addListener('focus', _onFocus),
      navigation.addListener('blur', _onBlur)
    ];
    return () => {
      subs.forEach(sub => sub());
    };
  }, [navigation]);

  return isFocused;
};
