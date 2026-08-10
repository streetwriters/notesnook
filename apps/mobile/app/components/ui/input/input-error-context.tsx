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

import React, {
  createContext,
  RefObject,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState
} from "react";
import { findNodeHandle, TextInput, View } from "react-native";
import Paragraph from "../typography/paragraph";
import { useThemeColors } from "@notesnook/theme";
import { Spacing } from "../../../common/design/spacing";
import AppIcon from "../AppIcon";

interface InputErrorContextType {
  setError: (nativeId: number, message: string | null) => void;
  getError: (nativeId: number) => string | null;
}

const InputErrorContext = createContext<InputErrorContextType | null>(null);

export function InputErrorProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [errors, setErrors] = useState<Map<number, string | null>>(new Map());

  const setError = useCallback((nativeId: number, message: string | null) => {
    setErrors((prev) => {
      const next = new Map(prev);
      if (message === null) {
        next.delete(nativeId);
      } else {
        next.set(nativeId, message);
      }
      return next;
    });
  }, []);

  const getError = useCallback(
    (nativeId: number) => errors.get(nativeId) ?? null,
    [errors]
  );

  const value = useMemo(() => ({ setError, getError }), [setError, getError]);

  return (
    <InputErrorContext.Provider value={value}>
      {children}
    </InputErrorContext.Provider>
  );
}

export function useInputError() {
  return useContext(InputErrorContext);
}

interface ErrorContainerProps {
  inputRef: RefObject<TextInput | null>;
}

export function ErrorContainer({ inputRef }: ErrorContainerProps) {
  const ctx = useInputError();
  const { colors } = useThemeColors();
  const nativeIdRef = useRef<number | null>(null);

  if (!ctx) return null;

  // Resolve the native ID lazily — the ref's current may not be set on first
  // render but will be by the time the input mounts and registers an error.
  const nativeId =
    nativeIdRef.current ??
    (inputRef.current
      ? (nativeIdRef.current = findNodeHandle(inputRef.current))
      : null);

  const message = nativeId !== null ? ctx.getError(nativeId) : null;

  if (!message) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        gap: Spacing.LEVEL_1
      }}
    >
      <AppIcon
        name="warning-circle"
        color={colors.static.red}
        iconFamily="notesnook"
        size={16}
      />
      <Paragraph color={colors.static.red} fontSize="SM">
        {message}
      </Paragraph>
    </View>
  );
}
