/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
import React, { RefObject, useRef, useState } from "react";
import { TextInput, View } from "react-native";
import ActionSheet from "react-native-actions-sheet";
import { db } from "../../../common/database";
import {
  eSendEvent,
  presentSheet,
  PresentSheetOptions,
  ToastEvent
} from "../../../services/event-manager";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import Input from "../../ui/input";

type ChangeEmailProps = {
  actionSheetRef: RefObject<ActionSheet>;
  close?: () => void;
  update?: (options: PresentSheetOptions) => void;
};

enum EmailChangeSteps {
  verify,
  changeEmail
}

export const ChangeEmail = ({
  actionSheetRef,
  close,
  update
}: ChangeEmailProps) => {
  const [step, setStep] = useState(EmailChangeSteps.verify);
  const emailChangeData = useRef<{
    email?: string;
    password?: string;
    code?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const emailInputRef = useRef<TextInput>(null);
  const passInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  const onSubmit = async () => {
    try {
      if (step === EmailChangeSteps.verify) {
        if (
          !emailChangeData.current.email ||
          !emailChangeData.current.password ||
          error
        )
          return;
        setLoading(true);
        const verified = await db.user?.verifyPassword(
          emailChangeData.current.password
        );
        if (!verified) throw new Error("Password is incorrect");
        await db.user?.sendVerificationEmail(emailChangeData.current.email);
        setStep(EmailChangeSteps.changeEmail);
        setLoading(false);
      } else {
        if (
          !emailChangeData.current.email ||
          !emailChangeData.current.password ||
          error ||
          !emailChangeData.current.code
        )
          return;
        await db.user?.changeEmail(
          emailChangeData.current.email,
          emailChangeData.current.password,
          emailChangeData.current.code
        );
        eSendEvent("userLoggedIn");
        close?.();
        ToastEvent.show({
          heading: `Email changed`,
          message: `Your account email has been updated to ${emailChangeData.current.email}`,
          type: "success",
          context: "global"
        });
      }
    } catch (e) {
      setLoading(false);
      ToastEvent.error(e as Error);
    }
  };

  return (
    <View style={{ paddingHorizontal: 12 }}>
      <DialogHeader
        title="Change email"
        paragraph="Your account email will be changed without affecting your subscription or any other settings."
      />
      <View
        style={{
          marginTop: 12
        }}
      >
        {step === EmailChangeSteps.verify ? (
          <>
            <Input
              fwdRef={emailInputRef}
              placeholder="Enter your new email"
              validationType="email"
              onErrorCheck={(e) => setError(e)}
              onChangeText={(email) => {
                emailChangeData.current.email = email;
              }}
            />
            <Input
              fwdRef={passInputRef}
              placeholder="Enter your account password"
              secureTextEntry
              onChangeText={(pass) => {
                emailChangeData.current.password = pass;
              }}
            />
          </>
        ) : (
          <>
            <Input
              fwdRef={codeInputRef}
              placeholder="Enter verification code sent to your new email"
              onChangeText={(code) => {
                emailChangeData.current.code = code;
              }}
            />
          </>
        )}
      </View>

      <Button
        title={
          loading
            ? undefined
            : step === EmailChangeSteps.verify
            ? "Verify"
            : "Change email"
        }
        type="accent"
        width={250}
        loading={loading}
        onPress={onSubmit}
        style={{
          borderRadius: 100,
          height: 45,
          marginTop: 2
        }}
      />
    </View>
  );
};

ChangeEmail.present = () => {
  presentSheet({
    component: (ref, close, update) => (
      <ChangeEmail actionSheetRef={ref} close={close} update={update} />
    )
  });
};
