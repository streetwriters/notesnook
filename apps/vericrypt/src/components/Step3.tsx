import { Flex, Button, Text, Input, Label } from "@theme-ui/components";
import { ProviderFactory } from "@notesnook/importer";
import { Providers } from "@notesnook/importer/dist/src/providers/providerfactory";
import { StepContainer } from "./StepContainer";

export function EnterAccountPassword() {
  return (
    <StepContainer as="form" sx={{ flexDirection: "column" }}>
      <Text variant="title">Step 3: Enter your account password</Text>
      <Input
        variant="forms.clean"
        id="password"
        name="password"
        type="password"
        placeholder="Your account password"
        sx={{
          mt: 2,
          fontSize: "subheading",
          fontFamily: "monospace",
          textAlign: "center",
        }}
      />
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
    </StepContainer>
  );
}
