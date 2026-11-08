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

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren
} from "react";
import { usePromise } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { lifecycle } from "@platform";
import { Button, Flex, Text } from "@ui";
import { Loading, Lock } from "../components/icons";
import { ErrorText } from "../components/error-text";
import Field from "../components/field";
import { getDocumentTitle, setDocumentTitle } from "../utils/dom";
import { WebAuthn } from "../utils/webauthn";
import {
  useKeyStore,
  type CredentialWithoutSecret
} from "../interfaces/key-store";
import { DialogManager } from "../common/dialog-manager";

export default function AppLock(props: PropsWithChildren<unknown>) {
  const credentials = useKeyStore((store) => store.activeCredentials());
  const isLocked = useKeyStore((store) => store.isLocked);
  const _lockAfter = useKeyStore((store) => store.secrets.lockAfter);
  const lockAfter = usePromise(async () => {
    if (isLocked) return null;
    return (await useKeyStore.getState().getValue("lockAfter")) || 0;
  }, [isLocked, _lockAfter]);

  const [error, setError] = useState<string>();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const windowTitle = useRef(getDocumentTitle());

  const unlockWithPassword = useCallback(
    async (credential: CredentialWithoutSecret) => {
      if (credential.type !== "password") return;

      setError(undefined);
      setIsUnlocking(true);

      if (!password || typeof password !== "string") {
        setIsUnlocking(false);
        setError(strings.passwordIsRequired());
        return;
      }

      await useKeyStore
        .getState()
        .unlock({ ...credential, password })
        .catch((e) => {
          setError(
            typeof e === "string"
              ? e
              : "message" in e && typeof e.message === "string"
              ? e.message === "ciphertext cannot be decrypted using that key" ||
                e.message === "Could not unwrap key." ||
                e.message === strings.couldNotUnwrapKey() ||
                e.message === strings.passwordIncorrect() ||
                e.message === "Wrong password."
                ? strings.wrongPassword()
                : e.message || strings.wrongPassword()
              : JSON.stringify(e)
          );
        })
        .finally(() => {
          setIsUnlocking(false);
        });
    },
    [password]
  );

  useEffect(() => {
    if (isLocked) {
      windowTitle.current = getDocumentTitle();
      // ../common/dialog-controller  closeOpenedDialog();
      setDocumentTitle(`Notesnook 🔒`);
    } else {
      setDocumentTitle(windowTitle.current);
    }
  }, [isLocked]);

  useEffect(() => {
    if (
      lockAfter.status !== "fulfilled" ||
      lockAfter.value === null ||
      credentials.length <= 0
    )
      return;

    if (lockAfter.value > 0) {
      const stop = lifecycle.startIdleDetection(
        lockAfter.value * 60 * 1000,
        () => useKeyStore.getState().relock()
      );
      return () => stop();
    } else if (lockAfter.value === 0) {
      const stop = lifecycle.onVisibilityChanged((_, hidden) => {
        if (hidden) useKeyStore.getState().relock();
      });

      return () => stop();
    }
  }, [lockAfter, credentials]);

  useEffect(() => {
    if (isLocked) {
      DialogManager.closeAll();
    }
  }, [isLocked]);

  if (isLocked)
    return (
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          flexDirection: "column"
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Lock size={100} color="icon" sx={{ opacity: 0.2 }} />
          <Text
            testID="unlock-note-title"
            variant="heading"
            sx={{ mx: 100, mt: 25, fontSize: 36, textAlign: "center" }}
          >
            {strings.unlockNotes()}
          </Text>
        </Flex>
        <Text
          variant="body"
          sx={{
            mt: 1,
            mb: 4,
            textAlign: "center",
            fontSize: "title",
            color: "paragraph-secondary"
          }}
        >
          {strings.verifyItsYou()}
        </Text>

        {isUnlocking ? (
          <Loading color="icon" />
        ) : (
          <Flex
            sx={{
              alignSelf: "stretch",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2
            }}
          >
            {credentials.map((credential) => {
              switch (credential.type) {
                case "password":
                  return (
                    <>
                      <Field
                        value={password}
                        onChangeText={setPassword}
                        testID="app-lock-password"
                        autoFocus
                        sx={{ width: ["95%", "95%", "25%"] }}
                        placeholder={strings.enterPassword()}
                        type="password"
                        onSubmit={() => unlockWithPassword(credential)}
                      />
                      <Button
                        variant="accent"
                        disabled={isUnlocking}
                        sx={{ borderRadius: 100, px: 30 }}
                        onPress={() => unlockWithPassword(credential)}
                      >
                        {strings.continue()}
                      </Button>
                    </>
                  );
                case "securityKey":
                  return (
                    <Flex
                      key={credential.id}
                      sx={{
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        width: ["95%", "95%", "25%"]
                      }}
                    >
                      <Field
                        testID="app-lock-security-key-pin"
                        type="password"
                        value={pin}
                        onChangeText={setPin}
                        placeholder="PIN"
                        sx={{ width: "100%" }}
                      />
                      <Button
                        variant="secondary"
                        onPress={async () => {
                          setError(undefined);
                          setIsUnlocking(true);
                          try {
                            const { encryptionKey } =
                              await WebAuthn.getEncryptionKey(
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
                        }}
                      >
                        {strings.unlockWithSecurityKey()}
                      </Button>
                    </Flex>
                  );
              }
            })}
          </Flex>
        )}
        {error && <ErrorText error={error} />}
      </Flex>
    );

  return <>{props.children}</>;
}
