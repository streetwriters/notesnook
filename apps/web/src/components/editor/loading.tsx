/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Flex, Text } from "@streetwriters/rebass";
import * as Icon from "../icons";

function EditorLoading({ text }: { text?: string }) {
  return (
    <Flex
      flexDirection="column"
      flex={1}
      justifyContent="center"
      alignItems="center"
    >
      <Icon.Loading color="primary" sx={{ mt: 2 }} />
      <Text variant="body" textAlign="center" mt={2}>
        {text || "Loading editor. Please wait..."}
      </Text>
    </Flex>
  );
}
export default EditorLoading;
