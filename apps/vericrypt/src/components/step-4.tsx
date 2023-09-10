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
import { Flex, Text, Image, Textarea } from "@theme-ui/components";
import { StepContainer } from "./step-container";
import DevtoolsRequestsFilter from "../assets/screenshots/devtools_requests_filter.png";
import DevtoolsRequestsWS from "../assets/screenshots/devtools_requests_ws.png";
import DevtoolsRequestsWSMessages from "../assets/screenshots/devtools_requests_ws_messages.png";
import DevtoolsRequestsWSMessagesSelect from "../assets/screenshots/devtools_requests_ws_messages_select.png";
import DevtoolsRequestsWSMessagesCopy from "../assets/screenshots/devtools_requests_ws_messages_copy.png";

// Firefox does not support extracting raw WebSocket response data yet.
// Once it does we can start using these.
// import FirefoxDevtoolsRequestsWS from "../assets/screenshots/firefox/devtools_requests_ws.png";
// import FirefoxDevtoolsRequestsFilter from "../assets/screenshots/firefox/devtools_requests_filter.png";
// import FirefoxDevtoolsRequestsWSResponse from "../assets/screenshots/firefox/devtools_requests_ws_response.png";
// import FirefoxDevtoolsRequestsWSResponseSizeColumn from "../assets/screenshots/firefox/devtools_requests_ws_response_sizecolumn.png";
// import FirefoxDevtoolsRequestsWSMessagesSelect from "../assets/screenshots/firefox/devtools_requests_ws_messages_select.png";
// import FirefoxDevtoolsRequestsWSMessagesCopy from "../assets/screenshots/firefox/devtools_requests_ws_messages_copy.png";

import { Accordion } from "./accordion";
import { getCombo } from "../utils/keycombos";
import Platform from "platform";
import { KeyCombo } from "./key-combo";
import { Code } from "./code";
import { useState, useEffect } from "react";
import { ErrorsList } from "./errors-list";
import { getSourceUrl } from "../utils/links";
import { MessagePackHubProtocol } from "@microsoft/signalr-protocol-msgpack";

type PasteEncryptedDataProps = {
  onEncryptedDataPasted: (data?: SyncRequestBody) => void;
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

const SAMPLE_CURL = `Paste raw base64 encoded data here.`;

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
    <Flex key="toggle-ws" sx={{ flexDirection: "column" }}>
      <Text as="p">
        Make sure you have <Code text="WS" /> toggled instead of{" "}
        <Code text="Fetch/XHR" />
      </Text>
      <Image src={DevtoolsRequestsWS} width={400} sx={{ mt: 1 }} />
    </Flex>,
    <Flex key="type-sync-in-filter" sx={{ flexDirection: "column" }}>
      <Text as="p">
        In the filter input, type <Code text="sync" /> to filter out sync
        requests.
      </Text>
      <Image src={DevtoolsRequestsFilter} width={400} sx={{ mt: 1 }} />
    </Flex>,
    <>
      <b>Refresh the page by pressing F5</b> (this is done so we can capture the
      websocket request that happens on startup).
    </>,
    <>
      Wait until a request starting with <Code text="sync?access_token=" /> pops
      up. It&apos;ll probably be the only one popping up and might take a bit so
      don&apos;t panic if you don&apos;t see anything.
    </>,
    <>Left-click on this request to open its details.</>,
    <Flex key="switch-to-code-tab" sx={{ flexDirection: "column" }}>
      <Text as="p">
        Switch to the <Code text="Messages" /> tab.
      </Text>
      <Image src={DevtoolsRequestsWSMessages} width={400} sx={{ mt: 1 }} />
    </Flex>,
    <>
      At this point, you will a list of Binary messages. None of these will
      appear really useful. This is normal.
    </>,
    <>
      Now try editing one of your notes and syncing. (Make sure to keep the{" "}
      <Code text="Network" /> tab open.)
    </>,
    <Flex key="new-binary-messages" sx={{ flexDirection: "column" }}>
      <Text as="p">
        You will see a bunch of new <Code text="Binary Messages" /> appear in
        the list. Find the one with the largest Length (in KBs). Also make sure
        the output type is set to <Code text="Base64" /> as in the screenshot
        below.
      </Text>
      <Image
        src={DevtoolsRequestsWSMessagesSelect}
        width={700}
        sx={{ mt: 1, maxWidth: "95%" }}
      />
    </Flex>,
    <Flex key="click-copy-button" sx={{ flexDirection: "column" }}>
      <Text as="p">Click on the copy button to copy the payload.</Text>
      <Image src={DevtoolsRequestsWSMessagesCopy} width={200} sx={{ mt: 1 }} />
    </Flex>,
    <> Paste it below to see the decrypted data.</>
  ],
  firefox: []
  // firefox: [
  //   "Focus the Notesnook tab in your browser.",
  //   <>
  //     Press <KeyCombo combo={getCombo("firefox", "developerTools")} /> to open
  //     Developer Tools.
  //   </>,
  //   <>
  //     Switch to the <Code text="Network" /> tab.
  //   </>,
  //   <Flex sx={{ flexDirection: "column" }}>
  // <Text as="p">
  //   Make sure you have <Code text="WS" /> toggled instead of{" "}
  //   <Code text="Fetch/XHR" />
  // </Text>
  //     <Image src={FirefoxDevtoolsRequestsWS} width={400} sx={{ mt: 1 }} />
  //   </Flex>,
  //   <Flex sx={{ flexDirection: "column" }}>
  //     <Text as="p">
  //       In the filter input, type <Code text="sync" /> to filter out sync
  //       requests.
  //     </Text>
  //     <Image src={FirefoxDevtoolsRequestsFilter} width={400} sx={{ mt: 1 }} />
  //   </Flex>,
  //   <>
  //     <b>Refresh the page by pressing F5</b> (this is done so we can capture the
  //     websocket request that happens on startup).
  //   </>,
  //   <>
  //     Wait until a request starting with <Code text="sync?access_token=" /> pops
  //     up. It'll probably be the only one popping up and might take a bit so
  //     don't panic if you don't see anything.
  //   </>,
  //   <>Left-click on this request to open its details.</>,
  //   <Flex sx={{ flexDirection: "column" }}>
  //     <Text as="p">
  //       Switch to the <Code text="Response" /> tab.
  //     </Text>
  //     <Image
  //       src={FirefoxDevtoolsRequestsWSResponse}
  //       width={400}
  //       sx={{ mt: 1 }}
  //     />
  //   </Flex>,
  //   <>
  //     At this point, you will a list of Binary messages. None of these will
  //     appear really useful. This is normal.
  //   </>,
  //   <Flex sx={{ flexDirection: "column" }}>
  //     <Text as="p">
  //       To help in finding the right request, <Code text="Right click" /> on the
  //       table header &amp; enable the <Code text="Size" /> column.
  //     </Text>
  //     <Image
  //       src={FirefoxDevtoolsRequestsWSResponseSizeColumn}
  //       width={300}
  //       sx={{ mt: 1 }}
  //     />
  //   </Flex>,
  //   <>
  //     Now try editing one of your notes and syncing. (Make sure to keep the{" "}
  //     <Code text="Network" /> tab open.)
  //   </>,
  //   <Flex sx={{ flexDirection: "column" }}>
  //     <Text as="p">
  //       You will see a bunch of new items appear in the table. Find the one with
  //       the largest Length (in KBs).
  //     </Text>
  //     <Image
  //       src={FirefoxDevtoolsRequestsWSMessagesSelect}
  //       width={700}
  //       sx={{ mt: 1, maxWidth: "95%" }}
  //     />
  //   </Flex>,
  //   <Flex sx={{ flexDirection: "column" }}>
  //     <Text as="p">
  //       Right-click on the item &amp; click on <Code text="Copy Message" />
  //     </Text>
  //     <Image
  //       src={FirefoxDevtoolsRequestsWSMessagesCopy}
  //       width={400}
  //       sx={{ mt: 1 }}
  //     />
  //   </Flex>,
  //   <> Paste it below to see the decrypted data.</>,
  // ],
};

const isChromium = Platform.name === "Chrome";
const isFirefox = Platform.name === "Firefox";
const instructions = isChromium
  ? steps.chromium
  : isFirefox
  ? steps.chromium
  : null;

export function PasteEncryptedData(props: PasteEncryptedDataProps) {
  const { onEncryptedDataPasted } = props;
  const [error, setError] = useState<string | undefined>();
  const [encryptedData, setEncryptedData] = useState<
    SyncRequestBody | undefined
  >();

  useEffect(() => {
    onEncryptedDataPasted(encryptedData);
  }, [encryptedData, onEncryptedDataPasted]);

  return (
    <StepContainer id="step_4" as="form" sx={{ flexDirection: "column" }}>
      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="title">Paste raw encrypted data</Text>
        <Code
          text="src/components/step-4.tsx"
          href={getSourceUrl("src/components/step-4.tsx")}
        />
      </Flex>
      <Accordion
        title="How to get raw encrypted data?"
        sx={{
          border: "1px solid var(--border)",
          mt: 2,
          borderRadius: "default"
        }}
      >
        {!isChromium && (
          <Flex sx={{ bg: "errorBg", p: 1 }}>
            <Text as="p" variant="body" sx={{ color: "error" }}>
              Currently Firefox does not support pasting raw data from the
              WebSocket response view.{" "}
              <b>Please use a Chromium-based browser</b> for grabbing the
              necessary data.
            </Text>
          </Flex>
        )}
        <Text variant="body" sx={{ mx: 2 }}>
          To make this whole process verifiable &amp; trustworthy, we need to
          extract the raw data that Notesnook sends to its servers during sync.
          That way you can be sure that the data leaving your device is actually
          encrypted or not.
        </Text>
        <Text as="ol" variant="body" sx={{ mb: 2 }}>
          {instructions?.map((item, index) => (
            <Text key={index.toString()} as="li" sx={{ mt: 1 }}>
              {item}
            </Text>
          ))}
        </Text>
      </Accordion>
      <Textarea
        variant="forms.clean"
        placeholder={SAMPLE_CURL}
        spellCheck={false}
        sx={{
          mt: 2,
          fontSize: "body",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          height: 280
        }}
        onChange={(e) => {
          try {
            setError(undefined);
            const base64Data = e.target.value;

            const protocol = new MessagePackHubProtocol();
            const messages = protocol
              .parseMessages(toArrayBuffer(base64Data), {
                log: console.log
              })
              .filter((m) => m.type === 1);

            if (!messages.length) {
              setError("Invalid message.");
              return setEncryptedData(undefined);
            }

            const syncData: SyncRequestBody = {
              attachments: [],
              content: [],
              notebooks: [],
              notes: []
            };
            for (const message of messages) {
              if (message.type === 1) {
                const { items, types } = message.arguments[0] as {
                  items?: string[];
                  types?: string[];
                };
                if (!items || !types) continue;

                for (let i = 0; i < types.length; ++i) {
                  const itemType = types[i];
                  const item = JSON.parse(items[i]) as EncryptedSyncItem;

                  switch (itemType) {
                    case "note":
                      syncData.notes.push(item);
                      break;
                    case "notebook":
                      syncData.notebooks.push(item);
                      break;
                    case "content":
                      syncData.content.push(item);
                      break;
                    case "attachment":
                      syncData.attachments.push(item);
                      break;
                    default:
                      continue;
                  }
                }
              }
            }

            if (syncData.notes.length <= 0 && syncData.content.length <= 0) {
              throw new Error(
                "The pasted data does not contain any notes. Please select another payload."
              );
            }

            setEncryptedData(syncData);
          } catch (e) {
            console.error(e);
            const error = e as Error;
            setError(error.message);
          }
        }}
      />
      {error ? <ErrorsList errors={[error]} /> : null}
      {encryptedData && (
        <Flex
          sx={{
            bg: "shade",
            border: "2px solid var(--primary)",
            mt: 2,
            p: 2,
            borderRadius: "default",
            flexDirection: "column"
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

function toArrayBuffer(payload: string) {
  const binary_string = window.atob(payload);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
