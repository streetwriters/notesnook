import { useState, useEffect } from 'react';
import { Keyboard, Dimensions } from 'react-native';

const useIsFloatingKeyboard = () => {
  const windowWidth = Dimensions.get('window').width;

  const [floating, setFloating] = useState(false);

  useEffect(() => {
    const onKeyboardWillChangeFrame = (event) => {
      setFloating(event.endCoordinates.width !== windowWidth);
    };

    Keyboard.addListener('keyboardWillChangeFrame', onKeyboardWillChangeFrame);
    return () => {
      Keyboard.removeListener('keyboardWillChangeFrame', onKeyboardWillChangeFrame);
    };
  }, [windowWidth]);

  return floating;
};

export default useIsFloatingKeyboard