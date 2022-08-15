import { useState } from "react";

const insetsStorage = localStorage.getItem("safeAreaInsets");
const initialState =
  insetsStorage && !globalThis.noHeader
    ? JSON.parse(insetsStorage)
    : {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      };

global.safeAreaController = {
  update: (safeArea) => {
    if (safeAreaController.set) safeAreaController.set(safeArea);
    safeAreaController.previous = safeArea;
    localStorage.setItem("safeAreaInsets", JSON.stringify(safeArea));
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
