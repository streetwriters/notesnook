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
import { Flex, Select, Text } from "@ui";
import { strings } from "@notesnook/intl";
import { LinkText } from "../../../dialogs/components/link-text";

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
          <LinkText href="https://github.com/streetwriters/notesnook-importer/issues/new">
            {strings.sendUsARequest()}
          </LinkText>
        </Text>
      </Flex>
      <Select
        options={[
          { value: "", title: strings.selectNotesApp() },
          ...ProviderFactory.getAvailableProviders().map((provider) => ({
            value: provider as string,
            title: ProviderFactory.getProvider(provider as Providers).name
          }))
        ]}
        value=""
        onChange={(value) => {
          if (value === "") return;
          props.onProviderChanged(
            ProviderFactory.getProvider(value as Providers)
          );
        }}
      />
    </Flex>
  );
}
