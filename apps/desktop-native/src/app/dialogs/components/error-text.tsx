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

import { Flex, Text, type SxProp } from "@ui";
import { Error as ErrorIcon, Warning } from "../../components/icons";

type ErrorTextProps = { error?: string | Error | null | false; sx?: SxProp };

function describe(error: string | Error) {
  return error instanceof Error
    ? `${error.name}: ${error.message}\n${error.stack || ""}`
    : error;
}

export function ErrorText(props: ErrorTextProps) {
  const { error, sx } = props;
  if (!error) return null;
  return (
    <Flex
      sx={{
        bg: "background-error",
        p: 1,
        borderRadius: "default",
        alignItems: "flex-start",
        flexDirection: "row",
        maxHeight: 300,
        ...sx
      }}
    >
      <ErrorIcon size={15} color="icon-error" />
      <Text
        variant="error"
        selectable
        sx={{ ml: 1, flex: 1, whiteSpace: "pre-wrap" }}
      >
        {describe(error)}
      </Text>
    </Flex>
  );
}

export function AuthErrorText(props: ErrorTextProps) {
  const { error, sx } = props;
  if (!error) return null;
  return (
    <Flex sx={{ alignItems: "center", flexDirection: "row", ...sx }}>
      <Warning size={13} color="icon-error" />
      <Text
        selectable
        sx={{
          ml: "spacing3",
          flex: 1,
          whiteSpace: "pre-wrap",
          fontWeight: 400,
          fontSize: "xs",
          color: "paragraph-error"
        }}
      >
        {describe(error)}
      </Text>
    </Flex>
  );
}
