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

import {
  IProvider,
  ProviderFactory,
  Providers
} from "@notesnook-importer/core";
import { Flex, Text } from "@theme-ui/components";

type ProviderSelectorProps = {
  onProviderChanged: (provider: IProvider) => void;
};

export function ProviderSelector(props: ProviderSelectorProps) {
  return (
    <Flex
      sx={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "start",
        gap: 4
      }}
    >
      <Flex sx={{ flexDirection: "column", flex: 1 }}>
        <Text variant="subtitle">Select a notes app to import from</Text>
        <Text
          variant="body"
          as="div"
          sx={{ mt: 1, color: "paragraph", whiteSpace: "pre-wrap" }}
        >
          Can&apos;t find your notes app in the list?{" "}
          <a href="https://github.com/streetwriters/notesnook-importer/issues/new">
            Send us a request.
          </a>
        </Text>
      </Flex>
      <select
        style={{
          backgroundColor: "var(--background-secondary)",
          outline: "none",
          border: "1px solid var(--border-secondary)",
          borderRadius: "5px",
          color: "var(--paragraph)",
          padding: "5px",
          overflow: "hidden"
        }}
        onChange={(e) => {
          if (e.target.value === "") return;
          const providerName: Providers = e.target.value as Providers;
          props.onProviderChanged(ProviderFactory.getProvider(providerName));
        }}
      >
        <option value="">Select notes app</option>
        {ProviderFactory.getAvailableProviders().map((provider) => (
          <option key={provider} value={provider}>
            {ProviderFactory.getProvider(provider as Providers).name}
          </option>
        ))}
      </select>
    </Flex>
  );
}
