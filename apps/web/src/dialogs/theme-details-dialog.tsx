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

import { strings } from "@notesnook/intl";
import { ThemeMetadata } from "@notesnook/themes-server";
import { Flex, Link, Text } from "@theme-ui/components";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import Dialog from "../components/dialog";
import { ThemePreview } from "../components/theme-preview";
import { useStore as useThemeStore } from "../stores/theme-store";

export type ThemeDetailsDialogProps = BaseDialogProps<boolean> & {
  theme: ThemeMetadata;
};

export const ThemeDetailsDialog = DialogManager.register(
  function ThemeDetailsDialog(props: ThemeDetailsDialogProps) {
    const { onClose, theme } = props;
    const isThemeCurrentlyApplied = useThemeStore(
      (store) => store.isThemeCurrentlyApplied
    );

    return (
      <Dialog
        isOpen={true}
        onClose={() => onClose(false)}
        positiveButton={{
          text: strings.setAsDefault(),
          onClick: () => onClose(true),
          disabled: isThemeCurrentlyApplied(theme.id)
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => onClose(false)
        }}
      >
        <ThemePreview theme={theme} />
        <Flex sx={{ flexDirection: "column", mt: 2 }}>
          <Text variant="heading">
            {theme.name}{" "}
            <Text variant="subBody" sx={{ fontSize: "subtitle" }}>
              v{theme.version}
            </Text>
          </Text>
          <Text variant="body" sx={{ fontSize: "title" }}>
            {theme.description}
          </Text>
          <Text variant="subBody" sx={{ fontSize: "subtitle" }}>
            {theme.authors.map((author) => author.name).join(", ")}
          </Text>
          {theme.totalInstalls && theme.totalInstalls > 0 ? (
            <Text variant="subBody" sx={{ fontSize: "subtitle" }}>
              {theme.totalInstalls} {strings.installs()}
            </Text>
          ) : null}
          <Text variant="subBody" sx={{ fontSize: "subtitle" }}>
            {strings.licenseUnder(theme.license)}
          </Text>
          <Flex sx={{ gap: 1, mt: 1 }}>
            {theme.homepage && (
              <Link
                href={theme.homepage}
                target="_blank"
                variant="text.subBody"
                sx={{ fontSize: "subtitle", color: "accent" }}
              >
                {strings.website()}
              </Link>
            )}
            {theme.sourceURL && (
              <Link
                href={theme.sourceURL}
                target="_blank"
                variant="text.subBody"
                sx={{ fontSize: "subtitle", color: "accent" }}
              >
                Source
              </Link>
            )}
          </Flex>
        </Flex>
      </Dialog>
    );
  }
);
