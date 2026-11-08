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

import { Button, Flex, Text } from "@ui";
import { shell } from "@platform";
import { Accordion } from "../../../dialogs/components/accordion";
import { strings } from "@notesnook/intl";

type ImportErrorsProps = {
  errors: Error[];
};

export function ImportErrors(props: ImportErrorsProps) {
  return (
    <Accordion
      isClosed={false}
      title={strings.errorsOccured(props.errors.length)}
      sx={{ bg: "background-error", borderRadius: "default", mt: 2 }}
    >
      <Flex sx={{ flexDirection: "column", px: 2, pb: 2 }}>
        {props.errors.map((error, index) => (
          <Text
            key={index}
            variant="body"
            selectable
            sx={{ color: "paragraph-error", my: 1, fontFamily: "monospace" }}
          >
            {index + 1}. {error.message}
          </Text>
        ))}
        <Button
          variant="error"
          sx={{ alignSelf: "flex-start", mt: 2 }}
          onPress={() =>
            shell.openUrl(
              "https://github.com/streetwriters/notesnook-importer/issues/new"
            )
          }
        >
          <Text>{strings.sendUsABugReport()}</Text>
        </Button>
      </Flex>
    </Accordion>
  );
}
