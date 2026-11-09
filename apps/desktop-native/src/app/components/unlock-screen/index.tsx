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
import { Box, Button, Flex, Text } from "@ui";
import Field from "../field";
import { Loading } from "../icons";
import AuthContainer from "../auth-container";
import { AuthErrorText } from "../error-text";
import {
  AuthField,
  AuthFormContainer,
  authFieldProps,
  SubmitButton
} from "../../views/auth";
import {
  useKeyStore,
  type CredentialWithoutSecret
} from "../../interfaces/key-store";
import { WebAuthn } from "../../utils/webauthn";

type UnlockFormData = { unlock: { password?: string } };

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

function SecurityKeyUnlock(props: {
  credential: Extract<CredentialWithoutSecret, { type: "securityKey" }>;
  separated: boolean;
}) {
  const { credential, separated } = props;
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string>();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const unlock = async () => {
    setError(undefined);
    setIsUnlocking(true);
    try {
      const { encryptionKey } = await WebAuthn.getEncryptionKey(
        credential.config,
        pin
      );
      await useKeyStore
        .getState()
        .unlock({ ...credential, key: encryptionKey });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <Flex
      testID="app-lock-security-key"
      sx={{ flexDirection: "column", width: "100%" }}
    >
      {separated ? (
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: "spacing4",
            mt: "spacing8"
          }}
        >
          <Box sx={{ flex: 1, height: 1, bg: "separator" }} />
          <Text sx={{ fontSize: "xs", color: "paragraph-secondary" }}>
            {strings.or()}
          </Text>
          <Box sx={{ flex: 1, height: 1, bg: "separator" }} />
        </Flex>
      ) : null}
      <Field
        {...authFieldProps}
        testID="app-lock-security-key-pin"
        type="password"
        label="PIN"
        placeholder="PIN"
        value={pin}
        onChangeText={setPin}
        onSubmit={unlock}
        autoFocus={!separated}
      />
      <AuthErrorText error={error} sx={{ mt: "spacing4", p: 0 }} />
      <Button
        testID="app-lock-security-key-submit"
        variant={separated ? "new_bordered" : "new_accent"}
        disabled={isUnlocking}
        onPress={unlock}
        sx={{ mt: "spacing8", width: "100%" }}
      >
        {isUnlocking ? (
          <Loading
            color={separated ? "icon" : "accentForeground"}
            size={15}
            sx={{ mr: "spacing6" }}
          />
        ) : null}
        {strings.unlockWithSecurityKey()}
      </Button>
    </Flex>
  );
}

export function UnlockScreen(props: {
  credentials: CredentialWithoutSecret[];
}) {
  const password = props.credentials.find(
    (credential) => credential.type === "password"
  );
  const securityKeys = props.credentials.filter(
    (
      credential
    ): credential is Extract<
      CredentialWithoutSecret,
      { type: "securityKey" }
    > => credential.type === "securityKey"
  );

  return (
    <AuthContainer showChangeServer={false}>
      <AuthFormContainer<"unlock", UnlockFormData>
        type="unlock"
        title={strings.unlockNotes()}
        titleTestID="unlock-note-title"
        subtitle={strings.verifyItsYou()}
        onSubmit={async (form) => {
          if (!password) return;
          if (!form.password) throw new Error(strings.passwordIsRequired());
          await useKeyStore
            .getState()
            .unlock({ ...password, password: form.password })
            .catch((e) => {
              throw new Error(describeError(e));
            });
        }}
      >
        {(_, options) => (
          <>
            {password ? (
              <>
                <AuthField
                  id="password"
                  testID="app-lock-password"
                  type="password"
                  label={strings.enterPassword()}
                  autoFocus
                />
                <SubmitButton
                  loading={options?.loading}
                  text={strings.unlock()}
                />
              </>
            ) : null}
            {securityKeys.map((credential) => (
              <SecurityKeyUnlock
                key={credential.id}
                credential={credential}
                separated={!!password}
              />
            ))}
          </>
        )}
      </AuthFormContainer>
    </AuthContainer>
  );
}
