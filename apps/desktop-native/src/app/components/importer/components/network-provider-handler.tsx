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

import { useRef, useState } from "react";
import {
  transform,
  type INetworkProvider,
  type ProviderSettings
} from "@notesnook-importer/core";
import { strings } from "@notesnook/intl";
import { xxhash64 } from "../../../utils/xxhash";
import { Button, Flex, ScrollContainer, Text } from "@ui";
import { shell } from "@platform";
import { importNote } from "../../../utils/importer";
import Accordion from "../../accordion";
import type { TransformResult } from "../types";

type NetworkProviderHandlerProps = {
  provider: INetworkProvider<ProviderSettings>;
  onTransformFinished: (result: TransformResult) => void;
};

export function NetworkProviderHandler(props: NetworkProviderHandlerProps) {
  const { provider, onTransformFinished } = props;
  const [totalNoteCount, setTotalNoteCount] = useState(0);
  const [, setCounter] = useState<number>(0);
  const logs = useRef<string[]>([]);

  async function onStartImport() {
    let totalNotes = 0;
    const settings: ProviderSettings = {
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
    };

    setTotalNoteCount(0);

    const errors = await transform(provider, settings);
    onTransformFinished({ totalNotes, errors });
  }

  return (
    <Flex sx={{ flexDirection: "column", alignItems: "stretch" }}>
      {totalNoteCount ? (
        <>
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
              sx={{ border: "1px solid", borderColor: "border", mt: 2 }}
            >
              <ScrollContainer sx={{ maxHeight: 250 }}>
                <Text
                  variant="body"
                  sx={{ fontFamily: "monospace", p: 2, whiteSpace: "pre" }}
                >
                  {logs.current.join("\n")}
                </Text>
              </ScrollContainer>
            </Accordion>
          )}
        </>
      ) : (
        <>
          <Text variant="title">
            {strings.connectYourAccount(provider.name)}
          </Text>
          <Text variant="body" sx={{ color: "paragraph-secondary", mt: 0 }}>
            {strings.checkOutOurStepByStepGuideOn()}{" "}
            <Text
              onPress={() => shell.openUrl(provider.helpLink)}
              sx={{ color: "accent", textDecorationLine: "underline" }}
            >
              {strings.howToImportFrom(provider.name)}
            </Text>
          </Text>
          <Button
            variant="accent"
            onPress={onStartImport}
            sx={{ my: 4, alignSelf: "center" }}
          >
            {strings.startImporting()}
          </Button>
        </>
      )}
    </Flex>
  );
}
