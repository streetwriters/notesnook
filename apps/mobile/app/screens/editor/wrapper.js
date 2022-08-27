import { useEffect } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Editor from ".";
import { PremiumToast } from "../../components/premium/premium-toast";
import { DDS } from "../../services/device-detection";
import { useNoteStore } from "../../stores/use-notes-store";
import { useSettingStore } from "../../stores/use-setting-store";
import { useThemeStore } from "../../stores/use-theme-store";
import { editorRef } from "../../utils/global-refs";
import useIsFloatingKeyboard from "../../hooks/use-is-floating-keyboard";
import useKeyboard from "../../hooks/use-keyboard";
import { ProgressBar } from "./progress";
import { editorController, editorState, textInput } from "./tiptap/utils";

export const EditorWrapper = ({ width }) => {
  const colors = useThemeStore((state) => state.colors);
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const loading = useNoteStore((state) => state.loading);
  const insets = useSafeAreaInsets();
  const floating = useIsFloatingKeyboard();
  const introCompleted = useSettingStore(
    (state) => state.settings.introCompleted
  );
  const keyboard = useKeyboard();

  const onAppStateChanged = async (state) => {
    if (editorState().movedAway) return;
    if (state === "active") {
      editorController.current.onReady();
    }
  };

  useEffect(() => {
    if (loading) return;
    let sub = AppState.addEventListener("change", onAppStateChanged);
    return () => {
      sub?.remove();
    };
  }, [loading]);

  const getMarginBottom = () => {
    console.log(insets.top);
    if (!keyboard.keyboardShown) return insets.bottom / 2;
    if (Platform.isPad && !floating) return 16;
    if (Platform.OS === "ios") return insets.bottom / 2;
    return 6;
  };

  return (
    <View
      testID="editor-wrapper"
      ref={editorRef}
      style={{
        width: width[!introCompleted ? "mobile" : deviceMode]?.c,
        height: "100%",
        backgroundColor: colors.bg,
        borderLeftWidth: DDS.isTab ? 1 : 0,
        borderLeftColor: DDS.isTab ? colors.nav : "transparent"
      }}
    >
      {loading || !introCompleted ? null : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            flex: 1,
            marginBottom: getMarginBottom()
          }}
          enabled={!floating}
          keyboardVerticalOffset={0}
        >
          <PremiumToast key="toast" context="editor" offset={50 + insets.top} />
          <TextInput
            key="input"
            ref={textInput}
            style={{ height: 1, padding: 0, width: 1, position: "absolute" }}
            blurOnSubmit={false}
          />
          <ProgressBar />
          <Editor key="editor" withController={true} />
        </KeyboardAvoidingView>
      )}
    </View>
  );
};
