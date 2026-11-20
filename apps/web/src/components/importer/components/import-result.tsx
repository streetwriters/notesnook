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

import { IProvider } from "@notesnook-importer/core";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text } from "@theme-ui/components";
import { ReactNode } from "react";
import { TransformResult } from "../types";
import { CardTitle, ImporterCard, LogsBox } from "./card";
import { ImportErrors } from "./import-errors";

type ImportResultProps = {
  result: TransformResult;
  provider: IProvider;
  filesCount?: number;
  logs?: ReactNode;
  onReset: () => void;
};

export function ImportResult(props: ImportResultProps) {
  const { result, onReset, logs, filesCount } = props;
  const hasLogs = !!logs;

  if (result.totalNotes <= 0) {
    return (
      <ImporterCard sx={{ p: "spacing6" }}>
        <CardTitle title={strings.importUnsuccessful()}>
          {strings.failedToImportSelectedFiles()}
        </CardTitle>
        {result.errors.length > 0 && <ImportErrors errors={result.errors} />}
        {hasLogs ? <LogsBox failed>{logs}</LogsBox> : null}
        <Flex sx={{ gap: "spacing4", alignItems: "center" }}>
          <Button
            variant="new_bordered"
            sx={{ px: "spacing8", py: "spacing6", fontSize: "xs" }}
            onClick={() =>
              window.open(
                "https://github.com/streetwriters/notesnook-importer/issues/new",
                "_blank"
              )
            }
          >
            {strings.sendUsABugReport()}
          </Button>
          <Button
            variant="new_accent"
            sx={{ px: "spacing8", py: "spacing6" }}
            onClick={onReset}
          >
            {strings.startOver()}
          </Button>
        </Flex>
      </ImporterCard>
    );
  }

  return (
    <ImporterCard>
      <CardTitle title={strings.importCompleted()}>
        {strings.notesSuccessfullyImported(result.totalNotes)}
      </CardTitle>
      <Text sx={{ fontSize: "xs", lineHeight: 1, color: "paragraph" }}>
        {filesCount !== undefined
          ? `${filesCount} ${filesCount === 1 ? "file" : "files"} • `
          : ""}
        {strings.foundNotes(result.totalNotes)}
      </Text>
      {result.errors.length > 0 && <ImportErrors errors={result.errors} />}
      {hasLogs ? <LogsBox>{logs}</LogsBox> : null}
      <Button
        variant="new_accent"
        sx={{ alignSelf: "flex-start", px: "spacing4" }}
        onClick={onReset}
      >
        {strings.startOver()}
      </Button>
    </ImporterCard>
  );
}
