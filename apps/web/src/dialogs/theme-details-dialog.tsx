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
        width="540px"
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
        <Flex sx={{ flexDirection: "column", gap: "spacing6", mb: "spacing7" }}>
          <ThemePreview
            theme={theme}
            height={262}
            windowTop={20}
            windowHeight={220}
            badge={theme.colorScheme === "dark" ? "DARK" : "LIGHT"}
          />
          <Flex sx={{ flexDirection: "column", gap: "spacing2" }}>
            <Text
              variant="heading"
              sx={{
                fontSize: "lg",
                fontWeight: 600,
                lineHeight: 1,
                color: "heading"
              }}
            >
              {theme.name}
            </Text>
            <Text
              variant="body"
              sx={{ fontSize: "md", lineHeight: 1.3, color: "paragraph" }}
            >
              {theme.description}
            </Text>
            <Text
              variant="body"
              sx={{ fontSize: "md", lineHeight: 1.3, color: "paragraph" }}
            >
              {[
                theme.authors.map((author) => author.name).join(", "),
                theme.totalInstalls && theme.totalInstalls > 0
                  ? `${theme.totalInstalls} ${strings.installs()}`
                  : null,
                strings.licenseUnder(theme.license)
              ]
                .filter(Boolean)
                .join(" | ")}
            </Text>
            <Flex sx={{ gap: "spacing3" }}>
              {theme.homepage && (
                <Link
                  href={theme.homepage}
                  target="_blank"
                  variant="text.body"
                  sx={{
                    fontSize: "md",
                    lineHeight: 1,
                    color: "accent",
                    textDecoration: "underline"
                  }}
                >
                  {strings.website()}
                </Link>
              )}
              {theme.sourceURL && (
                <Link
                  href={theme.sourceURL}
                  target="_blank"
                  variant="text.body"
                  sx={{
                    fontSize: "md",
                    lineHeight: 1,
                    color: "accent",
                    textDecoration: "underline"
                  }}
                >
                  {strings.source()}
                </Link>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Dialog>
    );
  }
);
