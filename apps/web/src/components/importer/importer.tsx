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
import { useState } from "react";
import { ProviderSelector } from "./components/provider-selector";
import { FileProviderHandler } from "./components/file-provider-handler";
import { ImportResult } from "./components/import-result";
import { IProvider } from "@notesnook-importer/core";
import { NetworkProviderHandler } from "./components/network-provider-handler";
import { TransformResult } from "./types";

export function Importer() {
  const [selectedProvider, setSelectedProvider] = useState<IProvider>();
  const [transformResult, setTransformResult] = useState<TransformResult>();
  const [instanceKey, setInstanceKey] = useState<string>(`${Math.random()}`);

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex
        sx={{
          flexDirection: "column",
          alignItems: "stretch",
          gap: 4
        }}
      >
        <ProviderSelector
          onProviderChanged={(provider) => {
            setInstanceKey(`${Math.random()}`);
            setSelectedProvider(provider);
            setTransformResult(undefined);
          }}
        />
        {selectedProvider ? (
          <>
            {selectedProvider.type === "file" ? (
              <FileProviderHandler
                key={instanceKey}
                provider={selectedProvider}
                onTransformFinished={setTransformResult}
              />
            ) : selectedProvider.type === "network" ? (
              <NetworkProviderHandler
                key={instanceKey}
                provider={selectedProvider}
                onTransformFinished={setTransformResult}
              />
            ) : null}
          </>
        ) : null}
        {transformResult && selectedProvider ? (
          <>
            <ImportResult
              result={transformResult}
              provider={selectedProvider}
              onReset={() => {
                setTransformResult(undefined);
                setInstanceKey(`${Math.random()}`);
              }}
            />
          </>
        ) : null}
      </Flex>
    </Flex>
  );
}
