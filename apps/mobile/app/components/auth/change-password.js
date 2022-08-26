import React, { useRef, useState } from "react";
import { View } from "react-native";
import { useThemeStore } from "../../stores/use-theme-store";
import { useUserStore } from "../../stores/use-user-store";
import {
  eSendEvent,
  presentSheet,
  ToastEvent
} from "../../services/event-manager";
import { db } from "../../common/database";
import { eCloseProgressDialog } from "../../utils/events";
import { Button } from "../ui/button";
import DialogHeader from "../dialog/dialog-header";
import Input from "../ui/input";
import { Notice } from "../ui/notice";
import Seperator from "../ui/seperator";

export const ChangePassword = () => {
  const colors = useThemeStore((state) => state.colors);
  const passwordInputRef = useRef();
  const password = useRef();
  const oldPasswordInputRef = useRef();
  const oldPassword = useRef();

  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = useUserStore((state) => state.user);

  const changePassword = async () => {
    if (!user?.isEmailConfirmed) {
      ToastEvent.show({
        heading: "Email not confirmed",
        message: "Please confirm your email to change account password",
        type: "error",
        context: "local"
      });
      return;
    }
    if (error || !oldPassword.current || !password.current) {
      ToastEvent.show({
        heading: "All fields required",
        message: "Fill all the fields and try again.",
        type: "error",
        context: "local"
      });
      return;
    }
    setLoading(true);
    try {
      await db.user.clearSessions();
      await db.user.changePassword(oldPassword.current, password.current);
      ToastEvent.show({
        heading: `Account password updated`,
        type: "success",
        context: "global"
      });
      setLoading(false);
      eSendEvent(eCloseProgressDialog);
    } catch (e) {
      setLoading(false);
      ToastEvent.show({
        heading: "Failed to change password",
        message: e.message,
        type: "error",
        context: "local"
      });
    }
    setLoading(false);
  };

  return (
    <View
      style={{
        width: "100%",
        padding: 12
      }}
    >
      <DialogHeader
        title="Change password"
        paragraph="Enter your old and new passwords"
      />
      <Seperator />

      <Input
        fwdRef={oldPasswordInputRef}
        onChangeText={(value) => {
          oldPassword.current = value;
        }}
        returnKeyLabel="Next"
        returnKeyType="next"
        secureTextEntry
        autoComplete="password"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Old Password"
      />

      <Input
        fwdRef={passwordInputRef}
        onChangeText={(value) => {
          password.current = value;
        }}
        onErrorCheck={(e) => setError(e)}
        returnKeyLabel="Next"
        returnKeyType="next"
        secureTextEntry
        validationType="password"
        autoComplete="password"
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="New password"
      />

      <Notice
        text="Changing password is a non-undoable process. You will be logged out from all your devices. Please make sure you do not close the app while your password is changing and have good internet connection."
        type="alert"
      />

      <Button
        style={{
          marginTop: 10,
          width: "100%"
        }}
        loading={loading}
        onPress={changePassword}
        type="accent"
        title={loading ? null : "I understand, change my password"}
      />
    </View>
  );
};

ChangePassword.present = () => {
  presentSheet({
    component: <ChangePassword />
  });
};
