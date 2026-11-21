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

import { create } from "zustand";
import type * as Contract from "../contracts/overlays";
import {
  Error as ErrorIcon,
  Info,
  Success,
  Warn
} from "../shared/icons";
import { Button, Flex, Text } from "./primitives";
import { ThemeScope } from "./theme";
import { dataColor } from "../shared/style/data-color";

type Entry = {
  id: string;
  type: Contract.ToastType;
  message: string;
  actions?: Contract.ToastAction[];
};

const useToasts = create<{ entries: Entry[] }>(() => ({ entries: [] }));
let toastCounter = 0;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function hide(id: string) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  useToasts.setState((state) => ({
    entries: state.entries.filter((entry) => entry.id !== id)
  }));
}

export const showToast: typeof Contract.showToast = (
  type,
  message,
  actions,
  hideAfter = 5000
) => {
  // Each call gets its own id, so equal messages stack and hide() only
  // hides the toast it returned.
  const id = `toast-${++toastCounter}`;
  useToasts.setState((state) => ({
    entries: [...state.entries, { id, type, message, actions }]
  }));
  if (hideAfter && Number.isFinite(hideAfter))
    timers.set(
      id,
      setTimeout(() => hide(id), hideAfter)
    );
  return { hide: () => hide(id) };
};

const ICONS = {
  error: { Icon: ErrorIcon, color: "icon-error" },
  success: { Icon: Success, color: "icon-success" },
  warn: { Icon: Warn, color: "icon" },
  info: { Icon: Info, color: dataColor("#0000ff") }
} as const;

export function ToastHost() {
  const entries = useToasts((state) => state.entries);
  if (entries.length === 0) return null;
  return (
    <ThemeScope scope="contextMenu">
      <div
        className="toasts-container"
        role="status"
        aria-live="polite"
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8
        }}
      >
        {entries.map((entry) => {
          const { Icon, color } = ICONS[entry.type];
          return (
            <Flex
              key={entry.id}
              testID="toast"
              sx={{
                flexDirection: "row",
                alignItems: "center",
                bg: "background",
                borderRadius: "radius2",
                boxShadow: "menu",
                maxWidth: 420,
                py: "8px",
                px: "10px",
                gap: 2
              }}
            >
              <Icon size={24} color={color} />
              <Text
                testID="toast-message"
                variant="body"
                sx={{ fontSize: "body", color: "paragraph", flexShrink: 1 }}
              >
                {entry.message}
              </Text>
              {entry.actions?.map((action, index) => (
                <Button
                  key={`${index}-${action.text}`}
                  onPress={action.onClick}
                  sx={{
                    py: "7px",
                    px: "spacing3",
                    m: 0,
                    flexShrink: 0,
                    bg: "transparent"
                  }}
                >
                  <Text
                    sx={{
                      fontSize: "body",
                      color: action.type || "accent"
                    }}
                  >
                    {action.text}
                  </Text>
                </Button>
              ))}
            </Flex>
          );
        })}
      </div>
    </ThemeScope>
  );
}
