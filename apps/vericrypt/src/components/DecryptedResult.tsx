import { Flex, Button, Text } from "@theme-ui/components";
import { StepContainer } from "./StepContainer";
import { SyncRequestBody } from "./Step4";
import { NNCrypto } from "@notesnook/crypto";
import { useEffect, useState } from "react";
import { FcDataEncryption } from "react-icons/fc";
import { Code } from "./Code";
import { getSourceUrl } from "../utils/links";
import * as clipboard from "clipboard-polyfill/text";

type DecryptedResultProps = {
  password: string;
  salt: string;
  data: SyncRequestBody;
  onRestartProcess: () => void;
};

export function DecryptedResult(props: DecryptedResultProps) {
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [decryptedData, setDecryptedData] = useState<string>();

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
        setIsDecrypting(false);
      } catch (e) {
        setIsDecrypting(false);
      }
    })();
  }, [props]);

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
