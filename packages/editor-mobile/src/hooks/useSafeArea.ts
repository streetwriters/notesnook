import { useState } from "react";

const initialState = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

global.safeAreaController = {
  update: (safeArea) => {
    if (safeAreaController.set) safeAreaController.set(safeArea);
    safeAreaController.previous = safeArea;
  },
  reset: () => {
    if (safeAreaController.set) safeAreaController.set(initialState);
  },
  previous: initialState,
};

export const useSafeArea = () => {
  const [safeArea, setSafeArea] = useState(global.safeAreaController.previous);
  global.safeAreaController.set = setSafeArea;

  return safeArea;
};
