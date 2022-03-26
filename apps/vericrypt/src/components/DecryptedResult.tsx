import { Flex, Button, Text, Link } from "@theme-ui/components";
import { StepContainer } from "./StepContainer";
import { SyncRequestBody } from "./Step4";
import { NNCrypto } from "@notesnook/crypto";
import { useEffect, useState } from "react";
import { FcDataEncryption } from "react-icons/fc";
import { Code } from "./Code";
import { getSourceUrl } from "../utils/links";
import * as clipboard from "clipboard-polyfill/text";
import { Accordion } from "./Accordion";
import { ErrorsList } from "./ErrorsList";

type DecryptedResultProps = {
  password: string;
  salt: string;
  data: SyncRequestBody;
  onRestartProcess: () => void;
};

export function DecryptedResult(props: DecryptedResultProps) {
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [decryptedData, setDecryptedData] = useState<string>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    (async function() {
      try {
        const data: any = {
          notes: [],
          notebooks: [],
          content: [],
          attachments: [],
        };
        const crypto = new NNCrypto();
        const key = await crypto.exportKey(props.password, props.salt);
        for (let arrayKey in data) {
          const array = data[arrayKey];
          for (let encryptedItem of (props.data as any)[arrayKey]) {
            const { data } = await crypto.decrypt(key, encryptedItem, "text");
            array.push(JSON.parse(data as string));
          }
        }
        setDecryptedData(JSON.stringify(data, undefined, "  "));
      } catch (e) {
        const error = e as Error;
        setError(error.message);
      } finally {
        setIsDecrypting(false);
      }
    })();
  }, [props]);

  if (error)
    return (
      <StepContainer
        as="form"
        sx={{
          flexDirection: "column",
        }}
      >
        <Text variant="title">Decryption failed</Text>
        <ErrorsList errors={[error]} />
      </StepContainer>
    );

  if (isDecrypting)
    return (
      <StepContainer
        as="form"
        sx={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FcDataEncryption size={50} />
        <Text variant="title" sx={{ mt: 2 }}>
          Decrypting your data...
        </Text>
      </StepContainer>
    );

  return (
    <StepContainer
      sx={{
        flexDirection: "column",
        border: "2px solid var(--theme-ui-colors-primary)",
      }}
    >
      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="title">Your data has been decrypted</Text>
        <Code
          text="src/components/DecryptedResult.tsx"
          href={getSourceUrl("src/components/DecryptedResult.tsx")}
        />
      </Flex>
      <Text variant="body">
        This is your data in it's raw decrypted format. Feel free to scroll
        through and see what it contains.
      </Text>
      <Text
        as="pre"
        variant="body"
        sx={{
          maxHeight: 400,
          overflowY: "auto",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          color: "icon",
          mt: 2,
        }}
      >
        {decryptedData}
      </Text>
      <Accordion
        title="What happens now?"
        sx={{
          border: "1px solid var(--theme-ui-colors-border)",
          mt: 2,
          borderRadius: "default",
        }}
      >
        <Text as="p" variant="body" sx={{ mx: 2 }}>
          Congratulations! You successfully verified Notesnook's data encryption
          claims.
        </Text>
        <Text as="p" variant="body" sx={{ mx: 2, mt: 2 }}>
          Of course, this is just one part (a very crucial one) of proving that
          you can trust Notesnook with your data. If you have any other
          preservations, let us know by reaching out to us at{" "}
          <Link href="mailto:support@streetwriters.co">
            support@streetwriters.co
          </Link>{" "}
          or{" "}
          <Link href="https://discord.gg/">joining our Discord community</Link>.
          We'll do our best to alleviate all your worries.
        </Text>
        <Text as="p" variant="body" sx={{ mx: 2, mt: 2, fontWeight: "bold" }}>
          What about open sourcing Notesnook?
        </Text>
        <Text as="p" variant="body" sx={{ mx: 2, my: 2 }}>
          Open sourcing is another part of garnering our users' trust. We have{" "}
          <Link href="https://notesnook.com/roadmap">plans</Link> to begin open
          sourcing in May but open sourcing will not make this tool obsolete.
          Verifying the integrity of encrypted data at any point in time is very
          important even if the software is open source.
        </Text>
      </Accordion>
      <Flex sx={{ alignSelf: "center", mt: 4 }}>
        <Button
          variant="secondary"
          sx={{ mr: 2 }}
          onClick={async () => {
            if (!decryptedData) return;
            await clipboard.writeText(decryptedData);
          }}
        >
          Copy data as JSON
        </Button>
        <Button variant="primary" onClick={props.onRestartProcess}>
          Start again
        </Button>
      </Flex>
    </StepContainer>
  );
}
