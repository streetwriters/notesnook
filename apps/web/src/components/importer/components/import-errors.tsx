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

import { Flex, Text } from "@theme-ui/components";

type ImportErrorsProps = {
  errors: Error[];
};

export function ImportErrors(props: ImportErrorsProps) {
  return (
    <Flex
      sx={{
        flexDirection: "column",
        gap: "spacing2",
        p: "spacing4",
        bg: "background-error",
        border: "1px solid",
        borderColor: "border-error",
        borderRadius: "radius1",
        fontSize: "xxs",
        lineHeight: "normal",
        color: "paragraph-error",
        overflowX: "auto"
      }}
    >
      <Text sx={{ fontWeight: 500, color: "inherit" }}>Error details</Text>
      {props.errors.map((error, index) => (
        <Text key={index} sx={{ whiteSpace: "pre-wrap", color: "inherit" }}>
          {error.message}
        </Text>
      ))}
    </Flex>
  );
}
