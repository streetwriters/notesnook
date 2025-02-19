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
import { CheckCircleOutline } from "../../icons";
import { TransformResult } from "../types";
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
        <Text variant="title">Import unsuccessful</Text>
        <Text variant="body" sx={{ mt: 2 }}>
          We failed to import the selected files. Please try again.
        </Text>
        {result.errors.length > 0 && <ImportErrors errors={result.errors} />}
        <Button
          variant="accent"
          onClick={onReset}
          sx={{ alignSelf: "center", mt: 2, px: 4 }}
        >
          Start over
        </Button>
      </Flex>
    );
  }

  return (
    <>
      <CheckCircleOutline color="accent" />
      <Text variant="body" my={2} sx={{ textAlign: "center" }}>
        {strings.importCompleted()}. {props.result.totalNotes} notes
        successfully imported.
        {strings.errorsOccured(result.errors.length)}
      </Text>
      <Button
        variant="secondary"
        sx={{ alignSelf: "center" }}
        onClick={async () => {
          onReset();
        }}
      >
        {strings.startOver()}
      </Button>
      {result.errors.length > 0 && (
        <Flex
          my={1}
          bg="var(--background-error)"
          p={1}
          sx={{ flexDirection: "column" }}
        >
          {result.errors.map((error) => (
            <Text
              key={error.message}
              variant="body"
              sx={{
                color: "var(--paragraph-error)"
              }}
            >
              {error.message}
            </Text>
          ))}
        </Flex>
      )}
    </>
  );
}
