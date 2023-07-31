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

import { Image, Flex, Text } from "@theme-ui/components";
import { ThemeProvider } from "@emotion/react";
import "./app.css";
import { MdVpnKey, MdCheck } from "react-icons/md";
import { BiPlus } from "react-icons/bi";
import { getDefaultAccentColor, useTheme } from "@notesnook/theme";
import { Hero } from "./components/hero";
import { LoginToNotesnook } from "./components/step-1";
import { GetAccountSalt } from "./components/step-2";
import { EnterAccountPassword } from "./components/step-3";
import { PasteEncryptedData, SyncRequestBody } from "./components/step-4";
import { StepSeperator } from "./components/step-seperator";
import { Footer } from "./components/footer";
import { useState } from "react";
import { NNCrypto } from "@notesnook/crypto";
import { Code } from "./components/code";
import { Accordion } from "./components/accordion";
import { DecryptedResult } from "./components/decrypted-result";
import Map from "./assets/images/map.svg";

const instructions = [
  "Go to Notesnook",
  "Open Settings",
  <>
    Click on <Code text="Backup data recovery key" />
  </>,
  "Enter your account password for verification",
  "Confirm that your generated encryption key matches"
];

function App() {
  const [password, setPassword] = useState<string>();
  const [salt, setSalt] = useState<string>();
  const [key, setKey] = useState<string>();
  const [data, setData] = useState<SyncRequestBody | undefined>();
  const theme = useTheme({ accent: getDefaultAccentColor(), theme: "light" });

  return (
    <ThemeProvider theme={theme}>
      <Flex sx={{ flexDirection: "column" }}>
        <Image src={Map} sx={{ position: "absolute", opacity: 0.1 }} />
        <Hero />
        <Flex
          sx={{
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <LoginToNotesnook />
          <StepSeperator />
          <GetAccountSalt onSaltSubmitted={setSalt} />

          {salt && (
            <>
              <StepSeperator icon={BiPlus} />
              <EnterAccountPassword onPasswordSubmitted={setPassword} />
            </>
          )}

          {salt && password && (
            <>
              <StepSeperator
                icon={MdVpnKey}
                tooltip="Click to see derived encryption key"
                onShowPopup={async () => {
                  if (!password) return false;
                  const { key } = await new NNCrypto().exportKey(
                    password,
                    salt
                  );
                  setKey(key);
                  return true;
                }}
                popup={{
                  title: "Your data encryption key",
                  body: key ? (
                    <>
                      <Text
                        as="code"
                        sx={{
                          fontFamily: "monospace",
                          mt: 2,
                          bg: "bgSecondary",
                          p: 1,
                          borderRadius: 5
                        }}
                      >
                        {key}
                      </Text>
                      <Accordion
                        title="How to verify your encryption key?"
                        sx={{
                          border: "1px solid var(--border)",
                          mt: 2,
                          borderRadius: "default"
                        }}
                      >
                        <Text variant="body" sx={{ mx: 2 }}>
                          Now that you have derived your encryption key,
                          you&apos;ll want to verify it to make sure we
                          didn&apos;t just make it up. To do so, follow these
                          steps:
                          <Text as="ol" variant="body" sx={{ mb: 2 }}>
                            {instructions?.map((item, index) => (
                              <Text
                                key={index.toString()}
                                as="li"
                                sx={{ mt: 1 }}
                              >
                                {item}
                              </Text>
                            ))}
                          </Text>
                        </Text>
                      </Accordion>
                    </>
                  ) : undefined
                }}
              />
              <PasteEncryptedData onEncryptedDataPasted={setData} />
            </>
          )}
          {password && salt && data && (
            <>
              <StepSeperator icon={MdCheck} />
              <DecryptedResult
                password={password}
                salt={salt}
                data={data}
                onRestartProcess={() => {
                  setSalt(undefined);
                  setPassword(undefined);
                  setKey(undefined);
                  setData(undefined);
                }}
              />
            </>
          )}
        </Flex>
        <Footer />
      </Flex>
    </ThemeProvider>
  );
}

export default App;
