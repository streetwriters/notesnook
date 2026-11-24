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

import { useRef, useState, useCallback } from "react";
import { Flex, Text, Button } from "@theme-ui/components";
import Field from "../field";
import { showToast } from "../../utils/toast";
import { AuthErrorText } from "../error-text";
import { strings } from "@notesnook/intl";
import UnlockNoteIllustration from "../../assets/unlock-note.svg?react";

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

  const passwordRef = useRef<HTMLInputElement>(null);

  const submit = useCallback(async () => {
    const password = passwordRef?.current?.value;
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
  }, [setErrorMessage, unlock]);

  return (
    <Flex
      mx={2}
      sx={{
        flex: "1",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "spacing7",
          width: "333px",
          maxWidth: "100%"
        }}
      >
        <UnlockNoteIllustration
          width={210}
          height={210}
          style={{ flexShrink: 0 }}
        />
        <Flex
          sx={{
            flexDirection: "column",
            alignItems: "center",
            gap: "spacing3",
            width: "100%"
          }}
        >
          <Text
            data-test-id="unlock-note-title"
            variant="heading"
            sx={{
              fontSize: "xl",
              fontWeight: 600,
              lineHeight: 1,
              color: "heading",
              textAlign: "center",
              wordBreak: "break-word"
            }}
          >
            {title}
          </Text>
          <Text
            variant="body"
            sx={{
              width: "253px",
              maxWidth: "100%",
              textAlign: "center",
              fontSize: "sm",
              lineHeight: 1.2,
              color: "paragraph"
            }}
          >
            {subtitle}
          </Text>
          <Field
            id="vaultPassword"
            data-test-id="unlock-note-password"
            inputRef={passwordRef}
            autoFocus
            label={strings.enterPassword()}
            placeholder={strings.enterYourPassword()}
            type="password"
            sx={{ width: "100%" }}
            styles={{
              label: { lineHeight: 1 },
              input: {
                height: "45px",
                px: "spacing4",
                py: "spacing6",
                fontSize: "sm",
                color: "paragraph"
              }
            }}
            onKeyUp={async (e) => {
              if (e.key === "Enter") {
                await submit();
              } else if (errorMessage) {
                setErrorMessage(undefined);
              }
            }}
          />
          <AuthErrorText
            error={errorMessage}
            sx={{ alignSelf: "flex-start", mt: "spacing1", p: 0 }}
          />
        </Flex>
        <Button
          variant="new_accent"
          data-test-id="unlock-note-submit"
          disabled={isUnlocking}
          sx={{ width: "100%", px: "spacing4" }}
          onClick={async () => {
            await submit();
          }}
        >
          {isUnlocking ? strings.unlocking() + "..." : buttonTitle}
        </Button>
      </Flex>
    </Flex>
  );
}
