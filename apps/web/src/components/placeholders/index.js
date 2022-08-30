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

import React from "react";
import { Button, Flex, Text } from "@streetwriters/rebass";

const PlaceholderLoader = React.lazy(() => import("./loader"));
function Placeholder(props) {
  const { id, text, callToAction } = props;

  return (
    <>
      <Flex
        variant="columnCenter"
        alignSelf="stretch"
        sx={{ position: "relative" }}
      >
        <React.Suspense fallback={<div />}>
          <PlaceholderLoader name={id} width={"150px"} height={"150px"} />
        </React.Suspense>
        <Text
          variant="body"
          mt={2}
          color="fontTertiary"
          textAlign="center"
          mx={4}
        >
          {text}
        </Text>
        {callToAction && (
          <Button
            mt={1}
            display="flex"
            sx={{ alignItems: "center", justifyContent: "center" }}
            variant="tool"
            onClick={callToAction.onClick}
          >
            <callToAction.icon size={18} color="primary" />
            <Text ml={1}>{callToAction.text}</Text>
          </Button>
        )}
      </Flex>
    </>
  );
}
export default Placeholder;
