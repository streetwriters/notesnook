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

import { Flex, FlexProps, Text } from "@theme-ui/components";

import { Error as ErrorIcon } from "../icons";

type ErrorTextProps = { error?: string | Error | null | false } & FlexProps;
export function ErrorText(props: ErrorTextProps) {
  const { error, sx, ...restProps } = props;

  if (!error) return null;
  return (
    <Flex
      bg="var(--background-error)"
      p={1}
      sx={{
        borderRadius: "default",
        mt: 2,
        ...sx,
        alignItems: "flex-start",
        maxHeight: 300,
        overflowY: "auto"
      }}
      {...restProps}
    >
      <ErrorIcon size={15} color="var(--icon-error)" />
      <Text
        className="selectable"
        variant={"error"}
        ml={1}
        sx={{ whiteSpace: "pre-wrap" }}
      >
        {error instanceof Error ? (
          <>
            {error.name}: {error.message}
            <br />
            {error.stack}
          </>
        ) : (
          error
        )}
      </Text>
    </Flex>
  );
}
