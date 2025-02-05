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
import { Accordion } from "./accordion";

type ErrorsListProps = {
  errors: string[];
};

export function ErrorsList(props: ErrorsListProps) {
  return (
    <Accordion
      title={`${props.errors.length} errors occurred`}
      sx={{ bg: "errorBg", borderRadius: "default", mt: 2 }}
      color="#E53935"
    >
      <Flex sx={{ flexDirection: "column", px: 2, pb: 2 }}>
        <Text variant="body" sx={{ color: "error" }}>
          {props.errors.map((error, index) => (
            <>
              {error}
              <br />
            </>
          ))}
        </Text>
        <Button
          sx={{ bg: "error", color: "static", alignSelf: "start", mt: 2 }}
          onClick={() =>
            window.open(
              "https://github.com/streetwriters/notesnook/issues/new",
              "_blank",
              "noopener"
            )
          }
        >
          Send us a bug report
        </Button>
      </Flex>
    </Accordion>
  );
}
