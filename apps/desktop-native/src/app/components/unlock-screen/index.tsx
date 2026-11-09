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

import { useState } from "react";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text } from "@ui";
import Field from "../field";
import { AuthErrorText } from "../error-text";
import { ArrowRight, Loading } from "../icons";
import { Logo } from "../navigation-menu/logo";
import { authFieldProps } from "../../views/auth";
import {
  useKeyStore,
  type CredentialWithoutSecret
} from "../../interfaces/key-store";
import { WebAuthn } from "../../utils/webauthn";

type SecurityKeyCredential = Extract<
  CredentialWithoutSecret,
  { type: "securityKey" }
>;

function describeError(e: unknown) {
  if (typeof e === "string") return e;
  const message =
    e && typeof e === "object" && "message" in e
      ? String((e as { message: unknown }).message)
      : undefined;
  if (!message) return JSON.stringify(e);
  return message === "ciphertext cannot be decrypted using that key" ||
    message === "Could not unwrap key." ||
    message === strings.couldNotUnwrapKey() ||
    message === strings.passwordIncorrect() ||
    message === "Wrong password."
    ? strings.wrongPassword()
    : message || strings.wrongPassword();
}

function SubmitArrow(props: {
  testID: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      testID={props.testID}
      variant="new_accent"
      disabled={props.loading}
      onPress={props.onPress}
      sx={{
        width: 40,
        height: 40,
        borderRadius: 100,
        p: 0,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {props.loading ? (
        <Loading color="accentForeground" size={16} />
      ) : (
        <ArrowRight color="accentForeground" size={16} />
      )}
    </Button>
  );
}

function QuietButton(props: {
  testID: string;
  text: string;
  onPress: () => void;
}) {
  return (
    <Button
      testID={props.testID}
      variant="new_anchor"
      onPress={props.onPress}
      sx={{ mt: "spacing6" }}
    >
      <Text sx={{ fontSize: "xs", color: "paragraph-secondary" }}>
        {props.text}
      </Text>
    </Button>
  );
}

export function UnlockScreen(props: {
  credentials: CredentialWithoutSecret[];
}) {
  const password = props.credentials.find(
    (credential) => credential.type === "password"
  );
  const securityKey = props.credentials.find(
    (credential): credential is SecurityKeyCredential =>
      credential.type === "securityKey"
  );
  const [selected, setMode] = useState<"password" | "securityKey">();
  const mode = selected ?? (password ? "password" : "choose");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const switchMode = (next: "password" | "securityKey") => {
    setMode(next);
    setValue("");
    setError(undefined);
  };

  const unlock = async () => {
    setError(undefined);
    if (mode === "password" && password) {
      if (!value) {
        setError(strings.passwordIsRequired());
        return;
      }
      setIsUnlocking(true);
      await useKeyStore
        .getState()
        .unlock({ ...password, password: value })
        .catch((e) => setError(describeError(e)))
        .finally(() => setIsUnlocking(false));
    } else if (mode === "securityKey" && securityKey) {
      setIsUnlocking(true);
      try {
        const { encryptionKey } = await WebAuthn.getEncryptionKey(
          securityKey.config,
          value
        );
        await useKeyStore
          .getState()
          .unlock({ ...securityKey, key: encryptionKey });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsUnlocking(false);
      }
    }
  };

  return (
    <Flex
      testID="unlock-screen"
      sx={{
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bg: "background",
        px: "spacing8"
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: 340
        }}
      >
        <Logo size={36} />
        <Text
          testID="unlock-note-title"
          sx={{
            mt: "spacing8",
            mb: "spacing9",
            fontSize: "xl",
            fontWeight: 600,
            color: "heading",
            textAlign: "center"
          }}
        >
          {strings.unlockNotes()}
        </Text>

        {mode === "choose" ? null : (
          <Flex
            sx={{
              flexDirection: "row",
              alignItems: "center",
              gap: "spacing4",
              width: "100%"
            }}
          >
            <Flex sx={{ flex: 1 }}>
              <Field
                key={mode}
                testID={
                  mode === "password"
                    ? "app-lock-password"
                    : "app-lock-security-key-pin"
                }
                type="password"
                placeholder={
                  mode === "password" ? strings.enterPassword() : "PIN"
                }
                autoFocus
                value={value}
                onChangeText={setValue}
                onSubmit={unlock}
                sx={{ width: "100%" }}
                styles={authFieldProps.styles}
              />
            </Flex>
            <SubmitArrow
              testID="app-lock-submit"
              loading={isUnlocking}
              onPress={unlock}
            />
          </Flex>
        )}

        {error ? (
          <AuthErrorText
            error={error}
            sx={{ mt: "spacing4", p: 0, alignSelf: "flex-start" }}
          />
        ) : null}

        {securityKey && mode !== "securityKey" ? (
          <QuietButton
            testID="app-lock-use-security-key"
            text={strings.unlockWithSecurityKey()}
            onPress={() => switchMode("securityKey")}
          />
        ) : null}
        {password && mode === "securityKey" ? (
          <QuietButton
            testID="app-lock-use-password"
            text={strings.enterPassword()}
            onPress={() => switchMode("password")}
          />
        ) : null}
      </Flex>
    </Flex>
  );
}
