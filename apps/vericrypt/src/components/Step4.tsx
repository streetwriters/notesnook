import { Flex, Text, Image, Textarea } from "@theme-ui/components";
import { StepContainer } from "./StepContainer";
import DevtoolsRequestsFilter from "../assets/screenshots/devtools_requests_filter.png";
import DevtoolsRequestsCopy from "../assets/screenshots/devtools_requests_copy.png";

import DevtoolsRequestsFilterFirefox from "../assets/screenshots/firefox/network_tab_firefox.png";
import DevtoolsRequestsCopyFirefox from "../assets/screenshots/firefox/copy_curl_request.png";

import { Accordion } from "./Accordion";
import { getCombo } from "../utils/keycombos";
import Platform from "platform";
import { KeyCombo } from "./KeyCombo";
import { Code } from "./Code";
import { CURLParser } from "parse-curl-js-fixed";
import { useState } from "react";
import { ErrorsList } from "./ErrorsList";
import { getSourceUrl } from "../utils/links";

type PasteEncryptedDataProps = {
  onEncryptedDataPasted: (data: SyncRequestBody) => void;
};

type EncryptedSyncItem = {
  alg: string;
  cipher: string;
  format: "base64";
  id: string;
  iv: string;
  length: number;
  salt: string;
  v: number;
};
export type SyncRequestBody = {
  notes: EncryptedSyncItem[];
  content: EncryptedSyncItem[];
  notebooks: EncryptedSyncItem[];
  attachments: EncryptedSyncItem[];
};

const SAMPLE_CURL = `Paste your cURL request here. 
For example:
curl 'https://api.notesnook.com/sync'
-H 'authority: api.notesnook.com'
-H 'authorization: Bearer 84374D98...'
-H ...
-H ...
-H 'content-type: application/json'
--data-raw '{"notes":[{...}], "notebooks": [{...}], "content": [{...}], "lastSynced":1443215713231}'
--compressed`;

const steps = {
  chromium: [
    "Focus the Notesnook tab in your browser.",
    <>
      Press <KeyCombo combo={getCombo("chromium", "developerTools")} /> to open
      Developer Tools.
    </>,
    <>
      Switch to the <Code text="Network" /> tab.
    </>,
    <Flex sx={{ flexDirection: "column" }}>
      <Text as="p">
        In the filter input, type <Code text="sync" /> to filter out sync
        requests.
      </Text>
      <Image src={DevtoolsRequestsFilter} width={400} sx={{ mt: 1 }} />
    </Flex>,
    <>
      At this point, you probably won't see anything useful. Try editing one of
      your notes and syncing. Make sure to keep the <Code text="Network" /> tab
      open.
    </>,
    <>
      In the requests table in <Code text="Network" /> tab, you'll now see 3 or
      more new requests popup.
    </>,
    <>
      We are interested in only the <Code text="sync" /> request. Right click on
      this request to open the context menu.
    </>,
    <Flex sx={{ flexDirection: "column" }}>
      <Text as="p">
        From the context menu, go to <Code text="Copy" /> &amp; click on{" "}
        <Code text="Copy as cURL" />.
      </Text>
      <Image src={DevtoolsRequestsCopy} width={400} sx={{ mt: 1 }} />
    </Flex>,
  ],
  firefox: [
    "Focus the Notesnook tab in your browser.",
    <>
      Press <KeyCombo combo={getCombo("chromium", "developerTools")} /> to open
      Developer Tools.
    </>,
    <>
      Switch to the <Code text="Network" /> tab.
    </>,
    <Flex sx={{ flexDirection: "column" }}>
      <Text as="p">
        In the filter input, type <Code text="sync" /> to filter out sync
        requests.
      </Text>
      <Image src={DevtoolsRequestsFilterFirefox} width={400} sx={{ mt: 1 }} />
    </Flex>,
    <>
      At this point, you probably won't see anything useful. Try editing one of
      your notes and syncing. Make sure to keep the <Code text="Network" /> tab
      open.
    </>,
    <>
      In the requests table in <Code text="Network" /> tab, you'll now see 3 or
      more new requests popup.
    </>,
    <>
      We are interested in only the <Code text="sync" /> request. Right click on
      this request to open the context menu.
    </>,
    <Flex sx={{ flexDirection: "column" }}>
      <Text as="p">
        From the context menu, go to <Code text="Copy" /> &amp; click on{" "}
        <Code text="Copy as cURL" />.
      </Text>
      <Image src={DevtoolsRequestsCopyFirefox} width={400} sx={{ mt: 1 }} />
    </Flex>,
  ],
};

const isChromium = Platform.name === "Chrome";
const isFirefox = Platform.name === "Firefox";
const instructions = isChromium
  ? steps.chromium
  : isFirefox
  ? steps.firefox
  : null;

export function PasteEncryptedData(props: PasteEncryptedDataProps) {
  const [error, setError] = useState<string | undefined>();
  const [encryptedData, setEncryptedData] = useState<
    SyncRequestBody | undefined
  >();

  return (
    <StepContainer
      onSubmit={(e) => {
        e.preventDefault();
        if (encryptedData) {
          document.getElementById("encrypted_data")?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
        return false;
      }}
      id="step_4"
      as="form"
      sx={{ flexDirection: "column" }}
    >
      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="title">Paste raw encrypted data</Text>
        <Code
          text="src/components/Step4.tsx"
          href={getSourceUrl("src/components/Step4.tsx")}
        />
      </Flex>
      <Accordion
        title="How to get raw encrypted data?"
        sx={{
          border: "1px solid var(--theme-ui-colors-border)",
          mt: 2,
          borderRadius: "default",
        }}
      >
        <Text variant="body" sx={{ mx: 2 }}>
          To make this whole process verifiable &amp; trustworthy, we need to
          extract the raw data that Notesnook sends to its servers during sync.
          That way you can be sure that the data leaving your device is actually
          encrypted or not.
        </Text>
        <Text as="ol" variant="body" sx={{ mb: 2 }}>
          {instructions?.map((item) => (
            <Text as="li" sx={{ mt: 1 }}>
              {item}
            </Text>
          ))}
        </Text>
      </Accordion>
      <Textarea
        variant="forms.clean"
        placeholder={SAMPLE_CURL}
        sx={{
          mt: 2,
          fontSize: "body",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          height: 280,
        }}
        onChange={(e) => {
          try {
            setError(undefined);
            const curlRequest = e.target.value;
            if (!curlRequest) return;
            const parsed = new CURLParser(curlRequest).parse();
            if (parsed.url !== "https://api.notesnook.com/sync") {
              setError(
                "Invalid cURL request. URL must be https://api.notesnook.com/sync."
              );
            }

            const syncData: SyncRequestBody = parsed.body.data;
            if (syncData.notes.length <= 0 || syncData.content.length <= 0) {
              setError(
                "Empty cURL request. Make sure the request body contains at least 1 note & 1 content."
              );
            }
            setEncryptedData(syncData);
            e.target.value = JSON.stringify(syncData, undefined, "  ");
            props.onEncryptedDataPasted(syncData);
          } catch (e) {
            const error = e as Error;
            setError(error.message);
          }
        }}
      />
      {error ? <ErrorsList errors={[error]} /> : null}
      {encryptedData && (
        <Flex
          id="encrypted_data"
          sx={{
            bg: "shade",
            border: "2px solid var(--theme-ui-colors-primary)",
            mt: 2,
            p: 2,
            borderRadius: "default",
            flexDirection: "column",
          }}
        >
          <Text variant="subtitle">Parsing complete</Text>
          <Text as="p" variant="body">
            We found {encryptedData.notes.length} note(s),{" "}
            {encryptedData.content.length} content(s),{" "}
            {encryptedData.notebooks.length} notebook(s) &amp;{" "}
            {encryptedData.attachments.length} attachments.
          </Text>
        </Flex>
      )}
    </StepContainer>
  );
}
