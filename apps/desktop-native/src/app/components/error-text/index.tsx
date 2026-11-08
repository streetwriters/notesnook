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

import { Flex, Text, type FlexProps } from "@ui";
import { Error as ErrorIcon, Warning } from "../icons";

type ErrorTextProps = {
  error?: string | Error | null | false;
} & Omit<FlexProps, "children">;

function errorMessage(error: string | Error) {
  return error instanceof Error
    ? `${error.name}: ${error.message}\n${error.stack}`
    : error;
}

export function ErrorText(props: ErrorTextProps) {
  const { error, sx, ...restProps } = props;

  if (!error) return null;
  return (
    <Flex
      bg="background-error"
      {...restProps}
      sx={{
        flexDirection: "row",
        p: 1,
        borderRadius: "default",
        alignItems: "flex-start",
        maxHeight: 300,
        ...sx
      }}
    >
      <ErrorIcon size={15} color="icon-error" />
      <Text selectable variant="error" sx={{ ml: 1, whiteSpace: "pre-wrap" }}>
        {errorMessage(error)}
      </Text>
    </Flex>
  );
}

export function AuthErrorText(props: ErrorTextProps) {
  const { error, sx, ...restProps } = props;

  if (!error) return null;
  return (
    <Flex
      {...restProps}
      sx={{ flexDirection: "row", alignItems: "center", ...sx }}
    >
      <Warning size={13} color="icon-error" />
      <Text
        selectable
        sx={{
          ml: "spacing3",
          whiteSpace: "pre-wrap",
          fontWeight: 400,
          fontSize: "xs",
          color: "paragraph-error"
        }}
      >
        {errorMessage(error)}
      </Text>
    </Flex>
  );
}
