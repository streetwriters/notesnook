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
import { Flex } from "@theme-ui/components";
import { ReactNodeViewProps } from "../react";

export function CalloutComponenet(props: ReactNodeViewProps) {
  const { forwardRef, node } = props;
  const { titleText, color } = node.attrs;

  return (
    <Flex
      ref={forwardRef}
      paddingLeft={25}
      sx={{
        flexDirection: "column",
        "::before": {
          content: `${JSON.stringify(titleText)}`,
          display: "flex",
          pt: 4,
          color: color + ")",
          fontWeight: 700
        },
        fontFamily: "inherit",
        borderLeft: `4px solid ${color + ")"}`,
        borderRadius: "4px",
        background: color + ",0.2)",
        pb: 4,
        pr: 4
      }}
    />
  );
}
