import { Button, Text } from "@theme-ui/components";
import { StepContainer } from "./StepContainer";
import { Code } from "./Code";
import { getPackageUrl } from "../utils/links";

export function LoginToNotesnook() {
  return (
    <StepContainer as="form" sx={{ flexDirection: "column" }}>
      <Text variant="title">Welcome to Vericrypt</Text>
      <Text as="p" variant="body" sx={{ mt: 1 }}>
        Trust is a huge problem in closed source end-to-end encrypted
        applications. How can you be sure that the app is actually encrypting
        your data?
      </Text>
      <Text as="p" variant="body" sx={{ mt: 1 }}>
        The only way to earn a user's trust is by allowing them to see how the
        underlying encryption actually works. To do this, we at Notesnook have
        taken several steps.
      </Text>
      <Text as="p" variant="body" sx={{ mt: 1 }}>
        The first step has been the{" "}
        <b>
          open sourcing of our{" "}
          <Code text="@notesnook/crypto" href={getPackageUrl("crypto")} />{" "}
          module
        </b>{" "}
        which is responsible for all cryptographic needs of the app.
      </Text>
      <Text as="p" variant="body" sx={{ mt: 1 }}>
        The second step is this tool which is also open source and uses{" "}
        <Code text="@notesnook/crypto" href={getPackageUrl("crypto")} />{" "}
        underneath. Vericrypt will allow you to verify all encryption claims
        made by Notesnook in a practical &amp; provable way right inside your
        browser.
      </Text>
      <Text
        as="p"
        variant="body"
        sx={{ mt: 1, bg: "bgSecondary", p: 2, borderRadius: 5 }}
      >
        When you use this tool, you'll be guided each step of the way to
        extract/insert raw data from raw sources.{" "}
        <b>The whole process happens completely in your browser offline</b> and
        you can even disconnect your internet to make sure we aren't just saying
        that.
      </Text>
      <Button sx={{ alignSelf: "center", mt: 2 }}>Login to Notesnook</Button>
    </StepContainer>
  );
}
