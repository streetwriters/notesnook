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
import { Flex, Text, Image, Input } from "@theme-ui/components";
import { StepContainer } from "./step-container";
import DevtoolsApplicationTab from "../assets/screenshots/devtools_application_tab.png";
import DevtoolsSelectDB from "../assets/screenshots/devtools_select_db.png";
import DevtoolsSalt from "../assets/screenshots/devtools_salt.png";

import DevtoolsFirefoxStorageTab from "../assets/screenshots/firefox/firefox_storage_tab.png";
import DevtoolsSelectDBFirefox from "../assets/screenshots//firefox/firefox_keyvalue_pairs.png";
import DevtoolsSaltFirefox from "../assets/screenshots/firefox/firefox_user_object.png";

import { Accordion } from "./accordion";
import { getCombo } from "../utils/keycombos";
import Platform from "platform";
import { KeyCombo } from "./key-combo";
import { Code } from "./code";
import { useState } from "react";
import { getSourceUrl } from "../utils/links";

type GetAccountSaltProps = {
  onSaltSubmitted: (salt: string) => void;
};

const steps = {
  chromium: [
    "Focus the Notesnook tab in your browser.",
    <>
      Press <KeyCombo combo={getCombo("chromium", "developerTools")} /> to open
      Developer Tools.
    </>,
    <Flex key="switch-to-application-tab" sx={{ flexDirection: "column" }}>
      <Text as="p">
        Switch to the <Code text="Application" /> tab.
      </Text>
      <Image src={DevtoolsApplicationTab} width={300} sx={{ mt: 1 }} />
    </Flex>,
    <>
      From the side menu, expand <Code text="IndexedDB" /> which is under the
      Storage heading.
    </>,
    `You'll see a number of databases . Expand the one that starts with "Notesnook".`,

    <Flex key="click-on-keyvaluepairs" sx={{ flexDirection: "column" }}>
      <Text as="p">
        Click on <Code text="keyvaluepairs" />.
      </Text>
      <Image src={DevtoolsSelectDB} width={200} sx={{ mt: 1 }} />
    </Flex>,
    <>
      On the right panel, you&apos;ll see an input with the placeholder
      &quot;Start from key&quot; at the top. Type <Code text="user" /> in that
      input.
    </>,
    `At the top of the list, you'll see an entry with key "user". Expand the value.`,
    <Flex key="key-named-salt" sx={{ flexDirection: "column" }}>
      <Text as="p">
        You&apos;ll see a key named <Code text="salt" />. Copy the value against
        it.
      </Text>
      <Image src={DevtoolsSalt} width={400} sx={{ mt: 1 }} />
    </Flex>
  ],
  firefox: [
    "Focus the Notesnook tab in your browser.",
    <>
      Press <KeyCombo combo={getCombo("firefox", "developerTools")} /> to open
      Developer Tools.
    </>,
    <Flex key="switch-to-storage-tab" sx={{ flexDirection: "column" }}>
      <Text as="p">
        Switch to the <Code text="Storage" /> tab.
      </Text>
      <Image src={DevtoolsFirefoxStorageTab} width={300} sx={{ mt: 1 }} />
    </Flex>,
    <>
      From the side menu, expand <Code text="IndexedDB" /> which is under the
      Storage heading.
    </>,
    `You'll see a number of databases . Expand the one that starts with "Notesnook".`,

    <Flex key="click-on-keyvaluepairs" sx={{ flexDirection: "column" }}>
      <Text as="p">
        Click on <Code text="keyvaluepairs" />.
      </Text>
      <Image src={DevtoolsSelectDBFirefox} width={200} sx={{ mt: 1 }} />
    </Flex>,
    <>
      On the right panel, you&apos;ll see an input with the placeholder
      &quot;Start from key&quot; at the top. Type <Code text="user" /> in that
      input. If you don&apos;t see the &apos;user&apos; object, scroll to end
      using <Code text="Page down" /> key in key-value pair list and then search
      again.
    </>,
    `At the top of the list, you'll see an entry with key "user". Expand the value.`,
    <Flex key="key-named-salt" sx={{ flexDirection: "column" }}>
      <Text as="p">
        You&apos;ll see a key named <Code text="salt" />. Right click and copy
        the value against it.
      </Text>
      <Image src={DevtoolsSaltFirefox} width={400} sx={{ mt: 1 }} />
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
        <Text variant="title">Account salt</Text>
        <Code
          text="src/components/step-2.tsx"
          href={getSourceUrl("src/components/step-2.tsx")}
        />
      </Flex>
      <Accordion
        title="How to get your account salt?"
        sx={{
          border: "1px solid var(--border)",
          mt: 2,
          borderRadius: "default"
        }}
      >
        <Text variant="body" sx={{ mx: 2 }}>
          We&apos;ll be extracting your account&apos;s salt right from
          Notesnook&apos;s local database that lives in your web browser. So put
          on your seat belt and let&apos;s get some salt!
        </Text>
        <Text as="ol" variant="body" sx={{ mb: 2 }}>
          {instructions?.map((item, index) => (
            <Text key={index.toString()} as="li" sx={{ mt: 1 }}>
              {item}
            </Text>
          ))}
        </Text>
      </Accordion>
      <Input
        variant="forms.clean"
        id="salt"
        name="salt"
        type="text"
        placeholder="Enter your account salt"
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
          try {
            const value = e.target.value;
            const isValid = Buffer.from(value, "base64").length === 16;
            if (!isValid) setIsSaltValid(false);
            else {
              setIsSaltValid(true);
              props.onSaltSubmitted(value);
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
