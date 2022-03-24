import { Flex, Text, Input } from "@theme-ui/components";
import { getSourceUrl } from "../utils/links";
import { Code } from "./Code";
import { StepContainer } from "./StepContainer";

type EnterAccountPasswordProps = {
  onPasswordSubmitted: (password: string) => void;
};

export function EnterAccountPassword(props: EnterAccountPasswordProps) {
  return (
    <StepContainer
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById("step_4")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return false;
      }}
      onSubmitCapture={() => false}
      inputMode="text"
      id="step_3"
      as="form"
      sx={{ flexDirection: "column" }}
    >
      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="title">Account password</Text>
        <Code
          text="src/components/Step3.tsx"
          href={getSourceUrl("src/components/Step3.tsx")}
        />
      </Flex>
      <Flex
        sx={{
          bg: "bgSecondary",
          mt: 2,
          p: 2,
          borderRadius: "default",
          flexDirection: "column",
        }}
      >
        <Text variant="subtitle">
          Does my account password ever gets sent to the server?
        </Text>
        <Text as="p" variant="body">
          Never. Your password never ever leaves the device. Everything is
          happening locally. For good measure, you can even disconnect your
          Internet. This is the most fundamental part of zero knowledge data
          encryption.
        </Text>
      </Flex>
      <Input
        variant="forms.clean"
        id="password"
        name="password"
        type="password"
        placeholder="Enter your account password"
        sx={{
          mt: 2,
          fontSize: "subheading",
          fontFamily: "monospace",
          textAlign: "center",
        }}
        onChange={(e) => {
          props.onPasswordSubmitted(e.target.value);
        }}
      />
    </StepContainer>
  );
}
