import { Platform } from "react-native";
import MMKVStorage, { ProcessingModes } from "react-native-mmkv-storage";

export const MMKV = new MMKVStorage.Loader()
  .setProcessingMode(
    Platform.OS === "ios"
      ? ProcessingModes.MULTI_PROCESS
      : ProcessingModes.SINGLE_PROCESS
  )
  .initialize();
