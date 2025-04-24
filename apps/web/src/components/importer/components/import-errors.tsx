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

import { Button, Flex, Text } from "@theme-ui/components";
import Accordion from "../../accordion";

type ImportErrorsProps = {
  errors: Error[];
};

export function ImportErrors(props: ImportErrorsProps) {
  return (
    <Accordion
      isClosed={false}
      title={`${props.errors.length} errors occured`}
      sx={{ bg: "background-error", borderRadius: "default", mt: 2 }}
      color="paragraph-error"
    >
      <Flex sx={{ flexDirection: "column", px: 2, pb: 2, overflowX: "auto" }}>
        {props.errors.map((error, index) => (
          <Text
            variant="body"
            sx={{ color: "paragraph-error", my: 1, fontFamily: "monospace" }}
          >
            {index + 1}. {error.message}
            <br />
          </Text>
        ))}
        <Button
          variant="error"
          sx={{ alignSelf: "start", mt: 2 }}
          onClick={() =>
            window.open(
              "https://github.com/streetwriters/notesnook-importer/issues/new",
              "_blank"
            )
          }
        >
          Send us a bug report
        </Button>
      </Flex>
    </Accordion>
  );
}
