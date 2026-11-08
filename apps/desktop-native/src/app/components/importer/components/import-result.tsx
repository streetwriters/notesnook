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

import type { IProvider } from "@notesnook-importer/core";
import { strings } from "@notesnook/intl";
import { Button, Flex, Text } from "@ui";
import { CheckCircleOutline } from "../../icons";
import type { TransformResult } from "../types";
import { ImportErrors } from "./import-errors";

type ImportResultProps = {
  result: TransformResult;
  provider: IProvider;
  onReset: () => void;
};

export function ImportResult(props: ImportResultProps) {
  const { result, onReset } = props;

  if (result.totalNotes <= 0) {
    return (
      <Flex sx={{ flexDirection: "column", alignItems: "stretch" }}>
        <Text variant="title">{strings.importUnsuccessful()}</Text>
        <Text variant="body" sx={{ mt: 2 }}>
          {strings.failedToImportSelectedFiles()}
        </Text>
        {result.errors.length > 0 && <ImportErrors errors={result.errors} />}
        <Button
          variant="accent"
          onPress={onReset}
          sx={{ alignSelf: "center", mt: 2, px: 4 }}
        >
          {strings.startOver()}
        </Button>
      </Flex>
    );
  }

  return (
    <>
      <CheckCircleOutline color="accent" />
      <Text variant="body" sx={{ my: 2, textAlign: "center" }}>
        {strings.importCompleted()}.{" "}
        {strings.notesSuccessfullyImported(props.result.totalNotes)}{" "}
        {strings.errorsOccured(result.errors.length)}
      </Text>
      <Button
        variant="secondary"
        sx={{ alignSelf: "center" }}
        onPress={onReset}
      >
        {strings.startOver()}
      </Button>
      {result.errors.length > 0 && (
        <Flex
          sx={{
            flexDirection: "column",
            my: 1,
            bg: "background-error",
            p: 1
          }}
        >
          {result.errors.map((error) => (
            <Text
              key={error.message}
              variant="body"
              sx={{ color: "paragraph-error" }}
            >
              {error.message}
            </Text>
          ))}
        </Flex>
      )}
    </>
  );
}
