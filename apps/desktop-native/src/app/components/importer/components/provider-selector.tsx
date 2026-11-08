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
  ProviderFactory,
  type IProvider,
  type Providers
} from "@notesnook-importer/core";
import { strings } from "@notesnook/intl";
import { shell } from "@platform";
import { Flex, Select, Text } from "@ui";

type ProviderSelectorProps = {
  onProviderChanged: (provider: IProvider) => void;
};

export function ProviderSelector(props: ProviderSelectorProps) {
  return (
    <Flex
      sx={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 4
      }}
    >
      <Flex sx={{ flexDirection: "column", flex: 1 }}>
        <Text variant="subtitle">{strings.selectNotesAppToImportFrom()}</Text>
        <Text
          variant="body"
          sx={{ mt: 1, color: "paragraph", whiteSpace: "pre-wrap" }}
        >
          {strings.cantFindNotesApp()}{" "}
          <Text
            onPress={() =>
              shell.openUrl(
                "https://github.com/streetwriters/notesnook-importer/issues/new"
              )
            }
            sx={{ color: "accent", textDecorationLine: "underline" }}
          >
            {strings.sendUsARequest()}
          </Text>
        </Text>
      </Flex>
      <Select
        testID="provider-selector"
        options={[
          { value: "", title: strings.selectNotesApp() },
          ...ProviderFactory.getAvailableProviders().map((provider) => ({
            value: provider,
            title: ProviderFactory.getProvider(provider as Providers).name
          }))
        ]}
        onChange={(value) => {
          if (value === "") return;
          props.onProviderChanged(
            ProviderFactory.getProvider(value as Providers)
          );
        }}
        sx={{ minWidth: 200 }}
      />
    </Flex>
  );
}
