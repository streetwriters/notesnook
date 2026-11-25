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
import { FileProviderHandler } from "./components/file-provider-handler";
import { NetworkProviderHandler } from "./components/network-provider-handler";
import { useImporterStore } from "./store";

export function Importer() {
  const { provider, instanceKey, transformResult, setResult, startOver } =
    useImporterStore();
  if (!provider) return null;

  return (
    <Flex
      sx={{ flexDirection: "column", alignItems: "stretch", gap: "spacing7" }}
    >
      {provider.type === "file" ? (
        <FileProviderHandler
          key={instanceKey}
          provider={provider}
          result={transformResult}
          onTransformFinished={setResult}
          onReset={startOver}
        />
      ) : provider.type === "network" ? (
        <NetworkProviderHandler
          key={instanceKey}
          provider={provider}
          result={transformResult}
          onTransformFinished={setResult}
          onReset={startOver}
        />
      ) : null}
    </Flex>
  );
}
