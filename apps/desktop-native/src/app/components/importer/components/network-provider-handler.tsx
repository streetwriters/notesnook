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

import {
  INetworkProvider,
  ProviderSettings,
  transform
} from "@notesnook-importer/core";
import { Button, Flex, ScrollContainer, Text } from "@ui";
import { xxhash64 } from "../xxhash";
import { LinkText } from "../../../dialogs/components/link-text";
import { useRef, useState } from "react";
import { importNote } from "../../../utils/importer";
import Accordion from "../../accordion";
import { TransformResult } from "../types";
import { strings } from "@notesnook/intl";

type NetworkProviderHandlerProps = {
  provider: INetworkProvider<ProviderSettings>;
  onTransformFinished: (result: TransformResult) => void;
};

type Progress = {
  total: number;
  done: number;
};

function getProviderSettings(
  provider: INetworkProvider<ProviderSettings>,
  settings: ProviderSettings
) {
  return settings;
}

export function NetworkProviderHandler(props: NetworkProviderHandlerProps) {
  const { provider, onTransformFinished } = props;
  const [totalNoteCount, setTotalNoteCount] = useState(0);
  const [_, setCounter] = useState<number>(0);
  const logs = useRef<string[]>([]);

  async function onStartImport() {
    let totalNotes = 0;
    const settings = getProviderSettings(provider, {
      clientType: "browser",
      hasher: { type: "xxh64", hash: xxhash64 },
      storage: {
        clear: async () => undefined,
        get: async () => [],
        write: async (data) => {
          logs.current.push(
            `[${new Date().toLocaleString()}] Pushing ${
              data.title
            } into database`
          );

          await importNote(data);
        },
        iterate: async function* () {
          yield* [] as never[];
          return null;
        }
      },
      log: (message) => {
        logs.current.push(
          `[${new Date(message.date).toLocaleString()}] ${message.text}`
        );
        setCounter((s) => ++s);
      },
      reporter: () => {
        setTotalNoteCount(++totalNotes);
      }
    });
    if (!settings) return;

    setTotalNoteCount(0);

    const errors = await transform(provider, settings);
    console.log(errors);
    onTransformFinished({
      totalNotes,
      errors
    });
  }

  return (
    <Flex
      sx={{
        flexDirection: "column",
        alignItems: "stretch"
      }}
    >
      {totalNoteCount ? (
        <Flex sx={{ flexDirection: "column" }}>
          <Text variant="title">
            {strings.importingNotesFrom(provider.name)}
          </Text>
          <Text variant="body" sx={{ mt: 4 }}>
            {strings.foundNotes(totalNoteCount)}
          </Text>
          {logs.current.length > 0 && (
            <Accordion
              isClosed={false}
              title={strings.logs()}
              sx={{
                border: "1px solid",
                borderColor: "border",
                mt: 2
              }}
            >
              <ScrollContainer>
                <Text
                  variant="body"
                  selectable
                  sx={{ fontFamily: "monospace", p: 2, whiteSpace: "pre-wrap" }}
                >
                  {logs.current.join("\n")}
                </Text>
              </ScrollContainer>
            </Accordion>
          )}
        </Flex>
      ) : (
        <Flex sx={{ flexDirection: "column" }}>
          <Text variant="title">
            {strings.connectYourAccount(provider.name)}
          </Text>
          <Text variant="body" sx={{ color: "paragraph-secondary", mt: 2 }}>
            {strings.checkOutOurStepByStepGuideOn()}{" "}
            <LinkText href={provider.helpLink}>
              {strings.howToImportFrom(provider.name)}
            </LinkText>
          </Text>
          <Button
            variant="accent"
            onPress={onStartImport}
            sx={{ my: 4, alignSelf: "center" }}
          >
            <Text>{strings.startImporting()}</Text>
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
