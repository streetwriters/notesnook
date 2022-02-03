import { Image, Flex, Text } from "@theme-ui/components";
import { ThemeProvider } from "@theme-ui/theme-provider";
import "./App.css";
import { MdVpnKey, MdCheck } from "react-icons/md";
import { BiPlus } from "react-icons/all";
import { ThemeFactory } from "./theme";
import { Hero } from "./components/Hero";
import { LoginToNotesnook } from "./components/Step1";
import { GetAccountSalt } from "./components/Step2";
import { EnterAccountPassword } from "./components/Step3";
import { PasteEncryptedData, SyncRequestBody } from "./components/Step4";
import { StepSeperator } from "./components/StepSeperator";
import { Footer } from "./components/Footer";
import { useState } from "react";
import { NNCrypto } from "@notesnook/crypto";
import { Code } from "./components/Code";
import { Accordion } from "./components/Accordion";
import { DecryptedResult } from "./components/DecryptedResult";
import Map from "./assets/images/map.svg";

const instructions = [
  "Go to Notesnook",
  "Open Settings",
  <>
    Click on <Code text="Backup data recovery key" />
  </>,
  "Enter your account password for verification",
  "Confirm that your generated encryption key matches",
];

function App() {
  const [password, setPassword] = useState<string>();
  const [salt, setSalt] = useState<string>();
  const [key, setKey] = useState<string>();
  const [data, setData] = useState<SyncRequestBody>();

  return (
    <ThemeProvider theme={ThemeFactory.construct()}>
      <Flex sx={{ flexDirection: "column" }}>
        <Image src={Map} sx={{ position: "absolute", opacity: 0.1 }} />
        <Hero />
        <Flex
          sx={{
            flexDirection: "column",
            alignItems: "center",
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
                          borderRadius: 5,
                        }}
                      >
                        {key}
                      </Text>
                      <Accordion
                        title="How to verify your encryption key?"
                        sx={{
                          border: "1px solid var(--theme-ui-colors-border)",
                          mt: 2,
                          borderRadius: "default",
                        }}
                      >
                        <Text variant="body" sx={{ mx: 2 }}>
                          Now that you have derived your encryption key, you'll
                          want to verify it to make sure we didn't just make it
                          up. To do so, follow these steps:
                          <Text as="ol" variant="body" sx={{ mb: 2 }}>
                            {instructions?.map((item) => (
                              <Text as="li" sx={{ mt: 1 }}>
                                {item}
                              </Text>
                            ))}
                          </Text>
                        </Text>
                      </Accordion>
                    </>
                  ) : (
                    undefined
                  ),
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
