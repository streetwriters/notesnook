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
import { Text, Link } from "@theme-ui/components";

type CodeProps = { text: string; href?: string };
export function Code(props: CodeProps) {
  return (
    <Text
      as="code"
      sx={{
        bg: "bgSecondary",
        px: 1,
        borderRadius: 5,
        fontFamily: "monospace",
        border: "1px solid var(--border)",
        cursor: props.href ? "pointer" : "unset"
      }}
    >
      {props.href ? (
        <Link href={props.href} color="primary">
          {props.text}
        </Link>
      ) : (
        props.text
      )}
    </Text>
  );
}
