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

import { EmotionThemeProvider } from "@notesnook/theme";
import { Icon } from "@notesnook/ui";
import { Button, Flex, Text } from "@theme-ui/components";
import { PropsWithChildren } from "react";
import { DesktopOnly, MobileOnly } from "../../components/responsive/index.js";
import { Icons } from "../icons.js";

type Action = {
  title: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
};
export type PopupProps = {
  title?: string;
  onClose?: () => void;
  onPin?: () => void;
  isPinned?: boolean;
  action?: Action;
};

export function Popup(props: PropsWithChildren<PopupProps>) {
  const { title, onClose, onPin, isPinned, action, children } = props;

  return (
    <EmotionThemeProvider scope="editorToolbar">
      <DesktopOnly>
        <Flex
          sx={{
            overflow: "hidden",
            bg: "background",
            flexDirection: "column",
            borderRadius: "default",
            // border: "1px solid var(--border)",
            boxShadow: "menu",
            minWidth: 200
          }}
        >
          {title && (
            <Flex
              className="movable"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                p: 2
              }}
            >
              <Text variant={"title"}>{title}</Text>
              <Flex sx={{ alignItems: "center", gap: 1 }}>
                {onPin ? (
                  <Button
                    variant={"secondary"}
                    sx={{ p: 0, bg: "transparent" }}
                    onClick={onPin}
                  >
                    <Icon
                      path={Icons.pin}
                      size={"medium"}
                      color={isPinned ? "accent" : "icon"}
                    />
                  </Button>
                ) : null}
                {onClose ? (
                  <Button
                    variant={"secondary"}
                    sx={{ p: 0, bg: "transparent" }}
                    onClick={onClose}
                  >
                    <Icon path={Icons.close} size={"big"} />
                  </Button>
                ) : null}
              </Flex>
            </Flex>
          )}
          {children}
          {title && action && (
            <Flex
              sx={{ justifyContent: "end" }}
              bg="var(--background-secondary)"
              p={1}
              px={2}
              mt={2}
            >
              <Button
                variant="dialog"
                onClick={
                  action.disabled || action.loading ? undefined : action.onClick
                }
                disabled={action.disabled || action.loading}
              >
                {action.loading ? (
                  <Icon path={Icons.loading} rotate size="medium" />
                ) : (
                  action.title
                )}
              </Button>
            </Flex>
          )}
        </Flex>
      </DesktopOnly>
      <MobileOnly>
        {children}

        {action && (
          <Button
            variant="accent"
            sx={{
              alignSelf: "stretch",
              mb: 1,
              mt: 2,
              mx: 1,
              py: 2
            }}
            onClick={action.disabled ? undefined : action?.onClick}
            disabled={action.disabled}
          >
            {action.loading ? (
              <Icon path={Icons.loading} rotate size="medium" />
            ) : (
              action.title
            )}
          </Button>
        )}
      </MobileOnly>
    </EmotionThemeProvider>
  );
}
