import { Flex, Button, Text, Input, Label } from "@theme-ui/components";
import { ProviderFactory } from "@notesnook/importer";
import { Providers } from "@notesnook/importer/dist/src/providers/providerfactory";
import { StepContainer } from "./StepContainer";

export function LoginToNotesnook() {
  return (
    <StepContainer as="form" sx={{ flexDirection: "column" }}>
      <Text variant="title">Step 1: Login to Notesnook</Text>
      <Text as="p" variant="body" sx={{ mt: 1 }}>
        Since we'll be decrypting your notes stored in Notesnook, the first step
        is to <b>login to your account in a modern web browser</b>. You can skip
        this step if you are already logged in.
      </Text>
      <Button sx={{ alignSelf: "center", mt: 1 }}>Login to Notesnook</Button>
    </StepContainer>
  );
}
