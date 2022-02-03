import { Flex, Text, Image, Input } from "@theme-ui/components";
import { StepContainer } from "./StepContainer";
import DevtoolsApplicationTab from "../assets/screenshots/devtools_application_tab.png";
import DevtoolsSelectDB from "../assets/screenshots/devtools_select_db.png";
import DevtoolsSalt from "../assets/screenshots/devtools_salt.png";
import { Accordion } from "./Accordion";
import { getCombo } from "../utils/keycombos";
import Platform from "platform";
import { KeyCombo } from "./KeyCombo";
import { Code } from "./Code";
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
    <Flex sx={{ flexDirection: "column" }}>
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

    <Flex sx={{ flexDirection: "column" }}>
      <Text as="p">
        Click on <Code text="keyvaluepairs" />.
      </Text>
      <Image src={DevtoolsSelectDB} width={200} sx={{ mt: 1 }} />
    </Flex>,
    <>
      On the right panel, you'll see an input with the placeholder "Start from
      key" at the top. Type <Code text="user" /> in that input.
    </>,
    `At the top of the list, you'll see an entry with key "user". Expand the value.`,
    <Flex sx={{ flexDirection: "column" }}>
      <Text as="p">
        You'll see a key named <Code text="salt" />. Copy the value against it.
      </Text>
      <Image src={DevtoolsSalt} width={400} sx={{ mt: 1 }} />
    </Flex>,
  ],
};

const isChromium = Platform.name === "Chrome";
const instructions = isChromium ? steps.chromium : null;

export function GetAccountSalt(props: GetAccountSaltProps) {
  const [isSaltValid, setIsSaltValid] = useState<boolean>();

  return (
    <StepContainer as="form" sx={{ flexDirection: "column" }}>
      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="title">Account salt</Text>
        <Code
          text="src/components/Step2.tsx"
          href={getSourceUrl("src/components/Step2.tsx")}
        />
      </Flex>
      <Accordion
        title="How to get your account salt?"
        sx={{
          border: "1px solid var(--theme-ui-colors-border)",
          mt: 2,
          borderRadius: "default",
        }}
      >
        <Text variant="body" sx={{ mx: 2 }}>
          We'll be extracting your account's salt right from Notesnook's local
          database that lives in your web browser. So put on your seat belt and
          let's get some salt!
        </Text>
        <Text as="ol" variant="body" sx={{ mb: 2 }}>
          {instructions?.map((item) => (
            <Text as="li" sx={{ mt: 1 }}>
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
              : "text",
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
            setIsSaltValid(false);
          }
        }}
      />
    </StepContainer>
  );
}
