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

import { PropsWithChildren, useEffect, useState } from "react";
import { useStore as useSettingStore } from "../stores/setting-store";
import { usePromise } from "@notesnook/common";
import { KeyChain } from "../interfaces/key-store";
import { Button, Flex, Text } from "@theme-ui/components";
import { Loading, Lock } from "../components/icons";
import { ErrorText } from "../components/error-text";
import Field from "../components/field";
import { startIdleDetection } from "../utils/idle-detection";
import { onPageVisibilityChanged } from "../utils/page-visibility";
import { closeOpenedDialog } from "../common/dialog-controller";
import { WebAuthn } from "../utils/webauthn";

export default function AppLock(props: PropsWithChildren<unknown>) {
  const keychain = usePromise(async () => ({
    isLocked: await KeyChain.isLocked(),
    credentials: await KeyChain.getCredentials()
  }));
  const [error, setError] = useState<string>();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const appLockSettings = useSettingStore((store) => store.appLockSettings);

  useEffect(() => {
    const { lockAfter, enabled } = appLockSettings;
    if (
      !enabled ||
      lockAfter === -1 ||
      keychain.status !== "fulfilled" ||
      keychain.value.isLocked
    )
      return;

    if (lockAfter > 0) {
      const stop = startIdleDetection(
        appLockSettings.lockAfter * 60 * 1000,
        () => {
          KeyChain.relock();
          closeOpenedDialog();
          keychain.refresh();
        }
      );
      return () => stop();
    } else if (lockAfter === 0) {
      const stop = onPageVisibilityChanged((_, hidden) => {
        if (hidden) {
          KeyChain.relock();
          closeOpenedDialog();
          keychain.refresh();
        }
      });

      return () => stop();
    }
  }, [appLockSettings, keychain]);

  if (keychain.status === "fulfilled" && !keychain.value.isLocked)
    return <>{props.children}</>;

  if (keychain.status === "fulfilled" && keychain.value.isLocked)
    return (
      <Flex
        as="form"
        sx={{
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          flexDirection: "column",
          overflowY: "auto"
        }}
        onSubmit={async (e) => {
          e.preventDefault();

          setError(undefined);
          setIsUnlocking(true);

          const data = new FormData(e.target as HTMLFormElement);
          const password = data.get("password");
          if (!password || typeof password !== "string") {
            setIsUnlocking(false);
            setError("Password is required.");
            return;
          }

          await KeyChain.unlock({ type: "password", id: "primary", password })
            .then(() => keychain.refresh())
            .catch((e) => {
              setError(
                typeof e === "string"
                  ? e
                  : "message" in e && typeof e.message === "string"
                  ? e.message ===
                    "ciphertext cannot be decrypted using that key"
                    ? "Wrong password."
                    : e.message
                  : JSON.stringify(e)
              );
            })
            .finally(() => {
              setIsUnlocking(false);
            });
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
            Unlock your notes
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
          Please verify it&apos;s you.
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
            {keychain.value.credentials.map((credential) => {
              switch (credential.type) {
                case "password":
                  return (
                    <>
                      <Field
                        id="password"
                        name="password"
                        data-test-id="app-lock-password"
                        autoFocus
                        required
                        sx={{ width: ["95%", "95%", "25%"] }}
                        placeholder="Enter password"
                        type="password"
                      />
                      <Button
                        type="submit"
                        variant="accent"
                        data-test-id="unlock-note-submit"
                        disabled={isUnlocking}
                        sx={{ borderRadius: 100, px: 30 }}
                      >
                        Continue
                      </Button>
                    </>
                  );
                case "key":
                  return (
                    <Button
                      key={credential.id}
                      variant="secondary"
                      type="button"
                      onClick={async () => {
                        const { securityKey } =
                          useSettingStore.getState().appLockSettings;
                        if (!securityKey) return;

                        setError(undefined);
                        setIsUnlocking(true);

                        try {
                          const { encryptionKey } =
                            await WebAuthn.getEncryptionKey({
                              firstSalt: Buffer.from(
                                securityKey.firstSalt,
                                "base64"
                              ),
                              label: securityKey.label,
                              rawId: Buffer.from(securityKey.rawId, "base64"),
                              transports: securityKey.transports
                            });

                          await KeyChain.unlock({
                            type: "key",
                            id: credential.id,
                            key: encryptionKey
                          });
                          keychain.refresh();
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setIsUnlocking(false);
                        }
                      }}
                    >
                      Unlock with{" "}
                      {credential.type === "key" &&
                      credential.id === "securityKey"
                        ? "security key"
                        : "key"}
                    </Button>
                  );
              }
            })}
          </Flex>
        )}
        {error && <ErrorText error={error} />}
      </Flex>
    );

  return null;
}
