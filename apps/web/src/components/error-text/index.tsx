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
import { ThemeVariant } from "../theme-provider";
import { Error } from "../icons";

type ErrorTextProps = { error?: string | null | false } & FlexProps;
export function ErrorText(props: ErrorTextProps) {
  const { error, sx, ...restProps } = props;

  if (!error) return null;
  return (
    <ThemeVariant variant="error">
      <Flex
        bg="background"
        p={1}
        mt={2}
        sx={{ borderRadius: "default", ...sx }}
        {...restProps}
      >
        <Error size={15} color="error" />
        <Text variant={"error"} bg="background" color="paragraph" ml={1}>
          {error}
        </Text>
      </Flex>
    </ThemeVariant>
  );
}
