import { Platform } from "react-native";

export const EDITOR_URI =
  Platform.OS === "android"
    ? "file:///android_asset/index.html"
    : "build.bundle/index.html";
