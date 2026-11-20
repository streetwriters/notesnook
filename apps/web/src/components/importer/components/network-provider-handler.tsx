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
import { Button } from "@theme-ui/components";
import { xxhash64 } from "hash-wasm";
import { useRef, useState } from "react";
import { importNote } from "../../../utils/importer";
import { CardTitle, ImporterCard, LogsBox } from "./card";
import { ImportResult } from "./import-result";
import { TransformResult } from "../types";
import { strings } from "@notesnook/intl";

type NetworkProviderHandlerProps = {
  provider: INetworkProvider<ProviderSettings>;
  result?: TransformResult;
  onTransformFinished: (result: TransformResult) => void;
  onReset: () => void;
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
  const { provider, result, onTransformFinished, onReset } = props;
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

  const logLines = logs.current.map((c, index) => <div key={index}>{c}</div>);

  if (result) {
    return (
      <ImportResult
        result={result}
        provider={provider}
        logs={logLines.length > 0 ? logLines : undefined}
        onReset={onReset}
      />
    );
  }

  if (totalNoteCount) {
    return (
      <ImporterCard>
        <CardTitle title={strings.importingNotesFrom(provider.name)}>
          {strings.foundNotes(totalNoteCount)}
        </CardTitle>
        {logLines.length > 0 && <LogsBox>{logLines}</LogsBox>}
      </ImporterCard>
    );
  }

  return (
    <ImporterCard>
      <CardTitle title={strings.connectYourAccount(provider.name)}>
        {strings.checkOutOurStepByStepGuideOn()}{" "}
        <a href={provider.helpLink} target="_blank" rel="noreferrer">
          {strings.howToImportFrom(provider.name)}
        </a>
      </CardTitle>
      <Button
        variant="new_accent"
        onClick={onStartImport}
        sx={{ alignSelf: "flex-start", px: "spacing4" }}
      >
        {strings.startImporting()}
      </Button>
    </ImporterCard>
  );
}
