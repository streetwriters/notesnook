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
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { usePromise } from "@notesnook/common";
// import { KeyChain } from "../interfaces/key-store";
import { Button, Flex, Text } from "@theme-ui/components";
import { Loading, Lock } from "../components/icons";
import { ErrorText } from "../components/error-text";
import Field from "../components/field";
import { startIdleDetection } from "../utils/idle-detection";
import { onPageVisibilityChanged } from "../utils/page-visibility";
import { WebAuthn } from "../utils/webauthn";
import { getDocumentTitle, setDocumentTitle } from "../utils/dom";
import { CredentialWithoutSecret, useKeyStore } from "../interfaces/key-store";
import { strings } from "@notesnook/intl";
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

  const passwordRef = useRef<HTMLInputElement>(null);
  const windowTitle = useRef(getDocumentTitle());

  const unlockWithPassword = useCallback(
    async (credential: CredentialWithoutSecret) => {
      if (credential.type !== "password") return;

      setError(undefined);
      setIsUnlocking(true);

      const password = passwordRef.current?.value;
      if (!password || typeof password !== "string") {
        setIsUnlocking(false);
        setError("Password is required.");
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
                e.message === "Could not unwrap key."
                ? "Wrong password."
                : e.message || "Wrong password."
              : JSON.stringify(e)
          );
        })
        .finally(() => {
          setIsUnlocking(false);
        });
    },
    []
  );

  useEffect(() => {
    if (isLocked) {
      windowTitle.current = getDocumentTitle();
      // ../common/dialog-controller  closeOpenedDialog();
      document.title = `Notesnook 🔒`;
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
      const stop = startIdleDetection(lockAfter.value * 60 * 1000, () =>
        useKeyStore.getState().relock()
      );
      return () => stop();
    } else if (lockAfter.value === 0) {
      const stop = onPageVisibilityChanged((_, hidden) => {
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
          height: "100%",
          flexDirection: "column",
          overflowY: "auto"
        }}
      >
        <Flex
          sx={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Lock size={100} sx={{ opacity: 0.2 }} />
          <Text
            data-test-id="unlock-note-title"
            variant="heading"
            mx={100}
            mt={25}
            sx={{ fontSize: 36, textAlign: "center" }}
          >
            {strings.unlockNotes()}
          </Text>
        </Flex>
        <Text
          variant="body"
          mt={1}
          mb={4}
          sx={{
            textAlign: "center",
            fontSize: "title",
            color: "var(--paragraph-secondary)"
          }}
        >
          {strings.verifyItsYou()}
        </Text>

        {isUnlocking ? (
          <Loading />
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
                        inputRef={passwordRef}
                        id="password"
                        name="password"
                        data-test-id="app-lock-password"
                        autoFocus
                        required
                        sx={{ width: ["95%", "95%", "25%"] }}
                        placeholder={strings.enterPassword()}
                        type="password"
                        onKeyUp={async (e) => {
                          if (e.key === "Enter")
                            await unlockWithPassword(credential);
                        }}
                      />
                      <Button
                        variant="accent"
                        disabled={isUnlocking}
                        sx={{ borderRadius: 100, px: 30 }}
                        onClick={() => unlockWithPassword(credential)}
                      >
                        {strings.continue()}
                      </Button>
                    </>
                  );
                case "securityKey":
                  return (
                    <Button
                      key={credential.id}
                      variant="secondary"
                      type="button"
                      onClick={async () => {
                        setError(undefined);
                        setIsUnlocking(true);
                        try {
                          const { encryptionKey } =
                            await WebAuthn.getEncryptionKey(credential.config);
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
