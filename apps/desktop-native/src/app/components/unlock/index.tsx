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

import { useCallback, useState } from "react";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text } from "@ui";
import { Lock } from "../icons";
import Field from "../field";
import { ErrorText } from "../error-text";
import { showToast } from "../../utils/toast";

type UnlockViewProps = {
  title: string;
  subtitle: string;
  buttonTitle: string;
  unlock: (password: string) => Promise<void>;
};
export function UnlockView(props: UnlockViewProps) {
  const { title, subtitle, buttonTitle, unlock } = props;
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [password, setPassword] = useState("");

  const submit = useCallback(async () => {
    if (!password) {
      setErrorMessage(strings.passwordRequired());
      return;
    }

    setIsUnlocking(true);
    try {
      await unlock(password);
    } catch (e) {
      if (
        e instanceof Error &&
        e.message.includes("ciphertext cannot be decrypted using that key")
      ) {
        setErrorMessage(strings.passwordIncorrect());
      } else {
        showToast("error", `${strings.couldNotUnlock()}: ` + e);
        console.error(e);
      }
    } finally {
      setIsUnlocking(false);
    }
  }, [password, unlock]);

  return (
    <Flex
      sx={{
        mx: 2,
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Flex sx={{ flexDirection: "column", alignItems: "center" }}>
        <Lock size={100} color="icon" sx={{ opacity: 0.2 }} />
        <Text
          testID="unlock-note-title"
          variant="heading"
          sx={{ mx: 100, mt: 25, fontSize: 36, textAlign: "center" }}
        >
          {title}
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
        {subtitle}
      </Text>
      <Field
        testID="unlock-note-password"
        autoFocus
        value={password}
        sx={{ width: ["95%", "95%", 400] }}
        placeholder={strings.enterPassword()}
        type="password"
        onChangeText={(text) => {
          setPassword(text);
          if (errorMessage) setErrorMessage(undefined);
        }}
        onSubmit={submit}
      />
      {errorMessage && <ErrorText sx={{ mt: 1 }} error={errorMessage} />}
      <Button
        variant="accent"
        testID="unlock-note-submit"
        disabled={isUnlocking}
        onPress={submit}
        sx={{ mt: 3, borderRadius: 100, px: 30 }}
      >
        {isUnlocking ? strings.unlocking() + "..." : buttonTitle}
      </Button>
    </Flex>
  );
}
