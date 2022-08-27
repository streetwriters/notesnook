import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

type NavigationFocus = {
  onFocus?: (prev: RefObject<boolean>) => boolean;
  onBlur?: (prev: RefObject<boolean>) => boolean;
  delay?: number;
  focusOnInit?: boolean;
};

export const useNavigationFocus = (
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>,
  { onFocus, onBlur, delay, focusOnInit = true }: NavigationFocus
) => {
  const [isFocused, setFocused] = useState(focusOnInit);
  const prev = useRef(false);
  const isBlurred = useRef(false);

  const _onFocus = useCallback(() => {
    setTimeout(
      () => {
        console.log("on focus", prev);
        const shouldFocus = onFocus ? onFocus(prev) : true;
        if (shouldFocus) {
          setFocused(true);
          prev.current = true;
        }
        isBlurred.current = false;
      },
      isBlurred.current ? 0 : delay || 300
    );
  }, [onFocus, prev]);

  const _onBlur = useCallback(() => {
    isBlurred.current = true;
    setTimeout(() => {
      const shouldBlur = onBlur ? onBlur(prev) : true;
      if (shouldBlur) {
        prev.current = false;
        setFocused(false);
      }
    }, delay || 300);
  }, [onBlur, prev]);

  useEffect(() => {
    if (!navigation) return;
    const subs = [
      navigation.addListener("focus", _onFocus),
      navigation.addListener("blur", _onBlur)
    ];
    return () => {
      subs.forEach((sub) => sub());
    };
  }, [navigation]);

  return isFocused;
};
