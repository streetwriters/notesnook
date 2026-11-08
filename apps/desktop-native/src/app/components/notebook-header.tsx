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

import type { Notebook } from "@notesnook/core";
import { Flex, Text } from "@ui";

export function NotebookHeader(props: {
  notebook: Notebook;
  totalNotes: number;
}) {
  const { notebook, totalNotes } = props;
  return (
    <Flex
      testID="notebook-header"
      sx={{
        flexDirection: "column",
        gap: "spacing3",
        px: "spacing6",
        py: "spacing4",
        borderBottom: "1px solid",
        borderBottomColor: "separator"
      }}
    >
      <Text
        testID="notebook-header-title"
        sx={{ color: "heading", fontSize: "md", fontWeight: "heading" }}
      >
        {notebook.title}
      </Text>
      {notebook.description ? (
        <Text sx={{ color: "paragraph", fontSize: "xs" }}>
          {notebook.description}
        </Text>
      ) : null}
      <Text
        testID="notebook-header-count"
        sx={{ color: "paragraph-secondary", fontSize: "3xs" }}
      >
        {`${totalNotes} notes`}
      </Text>
    </Flex>
  );
}
