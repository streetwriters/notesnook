import React from "react";
import { KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import useIsFloatingKeyboard from "../../hooks/use-is-floating-keyboard";
import { useSettingStore } from "../../stores/use-setting-store";
import { Header } from "../header";
import SelectionHeader from "../selection-header";
export const Container = ({ children }) => {
  const floating = useIsFloatingKeyboard();
  const introCompleted = useSettingStore(
    (state) => state.settings.introCompleted
  );
  return (
    <KeyboardAvoidingView
      behavior="padding"
      enabled={Platform.OS === "ios" && !floating}
      style={{
        flex: 1
      }}
    >
      <SafeAreaView
        style={{
          flex: 1,
          overflow: "hidden"
        }}
      >
        {!introCompleted ? null : (
          <>
            <SelectionHeader />
            <Header title="Header" screen="Header" />
          </>
        )}

        {children}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Container;
