import { useEffect, useState } from "react";
import { Keyboard, KeyboardEvent, useWindowDimensions } from "react-native";

/**
 * A hook that detects floating keyboard on iPad
 * @returns Is keyboard floating or not
 */
const useIsFloatingKeyboard = () => {
  const { width } = useWindowDimensions();

  const [floating, setFloating] = useState<boolean>(false);

  const onKeyboardWillChangeFrame = (event: KeyboardEvent) => {
    setFloating(event.endCoordinates.width !== width);
  };

  useEffect(() => {
    let sub1 = Keyboard.addListener(
      "keyboardWillChangeFrame",
      onKeyboardWillChangeFrame
    );
    return () => {
      sub1?.remove();
    };
  }, [width]);

  return floating;
};

export default useIsFloatingKeyboard;
