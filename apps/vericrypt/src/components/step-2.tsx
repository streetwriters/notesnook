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
import { Flex, Text, Image, Textarea } from "@theme-ui/components";
import { StepContainer } from "./step-container";
import DevtoolsCopyUsersChrome from "../assets/screenshots/devtools_copy_users.png";

import DevtoolsCopyUsersFirefox from "../assets/screenshots/firefox/firefox_copy_users.png";

import { Accordion } from "./accordion";
import { getCombo } from "../utils/keycombos";
import Platform from "platform";
import { KeyCombo } from "./key-combo";
import { Code } from "./code";
import { useState } from "react";
import { getSourceUrl } from "../utils/links";
import { Cipher } from "@notesnook/crypto";

type GetAccountSaltProps = {
  onSaltSubmitted: (salt: string) => void;
  setAccountDataKey: (accountDataKey: Cipher<"base64"> | null) => void;
};

const steps = {
  chromium: [
    "Focus the Notesnook tab in your browser.",
    <>
      Press <KeyCombo combo={getCombo("chromium", "developerTools")} /> to open
      Developer Tools.
    </>,
    <Text key="switch-to-network-tab" as="p">
      Switch to the <Code text="Network" /> tab.
    </Text>,
    <Text key="toggle-xhr-filter" as="p">
      Make sure you have the <Code text="Fetch/XHR" /> filter toggled.
    </Text>,
    <Text key="refresh-the-tab" as="p">
      Refresh the tab so you can see all the network requests.
    </Text>,
    <Flex key="key-named-salt" sx={{ flexDirection: "column" }}>
      <Text as="p">Follow the steps as shown in the image:</Text>
      <Image src={DevtoolsCopyUsersChrome} width={"100%"} sx={{ mt: 1 }} />
    </Flex>,
    <Flex key="copy-salt" sx={{ flexDirection: "column" }}>
      <Text as="p">Copy everything in the response and paste it below.</Text>
    </Flex>
  ],
  firefox: [
    "Focus the Notesnook tab in your browser.",
    <>
      Press <KeyCombo combo={getCombo("firefox", "developerTools")} /> to open
      Developer Tools.
    </>,
    <Text key="switch-to-network-tab" as="p">
      Switch to the <Code text="Network" /> tab.
    </Text>,
    <Text key="toggle-xhr-filter" as="p">
      Make sure you have the <Code text="XHR" /> filter toggled.
    </Text>,
    <Text key="refresh-the-tab" as="p">
      Refresh the tab so you can see all the network requests.
    </Text>,
    <Flex key="key-named-salt" sx={{ flexDirection: "column" }}>
      <Text as="p">Follow the steps as shown in the image:</Text>
      <Image src={DevtoolsCopyUsersFirefox} width={"100%"} sx={{ mt: 1 }} />
    </Flex>,
    <Flex key="copy-salt" sx={{ flexDirection: "column" }}>
      <Text as="p">Copy everything in the response and paste it below.</Text>
    </Flex>
  ]
};

const isChromium = Platform.name === "Chrome";
const isFirefox = Platform.name === "Firefox";
const instructions = isChromium
  ? steps.chromium
  : isFirefox
  ? steps.firefox
  : null;

console.log(Platform.name);
export function GetAccountSalt(props: GetAccountSaltProps) {
  const [isSaltValid, setIsSaltValid] = useState<boolean>();

  return (
    <StepContainer
      onSubmit={(e) => {
        e.preventDefault();
        if (isSaltValid) {
          document.getElementById("step_3")?.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
        }
        return false;
      }}
      onSubmitCapture={() => false}
      inputMode="text"
      id="step_2"
      as="form"
      sx={{ flexDirection: "column" }}
    >
      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="title">Account Key Data</Text>
        <Code
          text="src/components/step-2.tsx"
          href={getSourceUrl("src/components/step-2.tsx")}
        />
      </Flex>
      <Accordion
        title="How to get your key data?"
        sx={{
          border: "1px solid var(--border)",
          mt: 2,
          borderRadius: "default"
        }}
      >
        <Text variant="body" sx={{ mx: 2 }}>
          You&apos;ll be extracting your account&apos;s keys right from
          Notesnook&apos;s local database that lives in your web browser. So put
          on your seat belt and let&apos;s retrieve those keys.
        </Text>
        <Text as="ol" variant="body" sx={{ mb: 2 }}>
          {instructions?.map((item, index) => (
            <Text key={index.toString()} as="li" sx={{ mt: 1 }}>
              {item}
            </Text>
          ))}
        </Text>
      </Accordion>
      <Textarea
        variant="forms.clean"
        id="account-data"
        name="account-data"
        placeholder="Paste the response here"
        sx={{
          mt: 2,
          fontSize: "subheading",
          fontFamily: "monospace",
          textAlign: "center",
          color:
            isSaltValid === true
              ? "primary"
              : isSaltValid === false
              ? "error"
              : "text"
        }}
        spellCheck={false}
        onChange={(e) => {
          setIsSaltValid(undefined);
          /*
          If there is no dataEncryptionKey, try reading the legacyDataEncryptionKey.
          If there is a legacyDataEncryptionKey, use this one.
          If there is no legacyDataEncryptionKey, it is a legacy account (pre DEK update) that has not
          changed passwords. (Use master key instead.)
          */
          try {
            const value = JSON.parse(e.target.value);
            props.setAccountDataKey(value.dataEncryptionKey ?? value.legacyDataEncryptionKey ?? null);
            const salt = value.salt;
            const isValid = Buffer.from(salt, "base64").length === 16;
            if (!isValid) setIsSaltValid(false);
            else {
              setIsSaltValid(true);
              props.onSaltSubmitted(salt);
            }
          } catch (e) {
            console.error(e);
            setIsSaltValid(false);
          }
        }}
      />
    </StepContainer>
  );
}
