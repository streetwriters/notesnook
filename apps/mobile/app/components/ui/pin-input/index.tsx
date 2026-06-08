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

import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  AppStateStatus,
  KeyboardTypeOptions,
  TextInput,
  TextInputKeyPressEvent,
  TextInputProps,
  TouchableOpacity,
  View
} from "react-native";
import { Radius, Spacing } from "../../../common/design/spacing";
import { AppFontSize } from "../../../utils/size";

type PinInputProps = {
  value: string;
  length: number;
  testID?: string;
  autoFocus?: boolean;
  inputRef?: RefObject<TextInput | null>;
  keyboardType?: KeyboardTypeOptions;
  onSubmitEditing?: TextInputProps["onSubmitEditing"];
  onChangeText: (value: string) => void;
  sanitize?: (value: string) => string;
};

const defaultSanitizer = (value: string) => value;

const PinInput = ({
  value,
  length,
  testID,
  autoFocus,
  inputRef,
  keyboardType = "number-pad",
  onSubmitEditing,
  onChangeText,
  sanitize = defaultSanitizer
}: PinInputProps) => {
  const { colors } = useThemeColors();
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastAutoFilledValue = useRef<string>("");
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const normalizeToCells = useMemo(
    () => (raw: string) => {
      const sanitized = sanitize(raw).slice(0, length);
      const next = Array.from({ length }, () => "");
      sanitized.split("").forEach((char, index) => {
        next[index] = char;
      });
      return next;
    },
    [length, sanitize]
  );

  const [cells, setCells] = useState<string[]>(() => normalizeToCells(value));

  const emitChange = React.useCallback(
    (nextCells: string[]) => {
      onChangeText(nextCells.join(""));
    },
    [onChangeText]
  );

  const focusCell = React.useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, length - 1));
      requestAnimationFrame(() => {
        inputRefs.current[clampedIndex]?.focus();
      });
    },
    [length]
  );

  useEffect(() => {
    if (autoFocus) {
      focusCell(0);
    }
  }, [autoFocus, focusCell]);

  useEffect(() => {
    // Parent-driven resets should clear all slots.
    if (!value) {
      setCells(Array.from({ length }, () => ""));
      return;
    }

    // Parent-driven complete values (OTP autofill, test paste) should sync.
    if (value.length >= length) {
      setCells(normalizeToCells(value));
    }
  }, [length, normalizeToCells, value]);

  const onCellChange = (index: number, text: string) => {
    const sanitized = sanitize(text);
    const nextCells = [...cells];

    if (!sanitized) {
      nextCells[index] = "";
      setCells(nextCells);
      emitChange(nextCells);
      return;
    }

    const chars = sanitized.split("");
    let cursor = index;
    chars.forEach((char) => {
      if (cursor < length) {
        nextCells[cursor] = char;
        cursor += 1;
      }
    });

    setCells(nextCells);
    emitChange(nextCells);

    if (cursor < length) {
      focusCell(cursor);
    } else {
      inputRefs.current[length - 1]?.blur();
    }
  };

  const onCellKeyPress = (index: number, event: TextInputKeyPressEvent) => {
    if (event.nativeEvent.key !== "Backspace") return;

    const nextCells = [...cells];

    if (nextCells[index]) {
      nextCells[index] = "";
      setCells(nextCells);
      emitChange(nextCells);
      return;
    }

    if (index > 0) {
      nextCells[index - 1] = "";
      setCells(nextCells);
      emitChange(nextCells);
      focusCell(index - 1);
    }
  };

  const onBulkInputChange = (text: string) => {
    const sanitized = sanitize(text).slice(0, length);
    const nextCells = normalizeToCells(sanitized);
    setCells(nextCells);
    emitChange(nextCells);

    if (sanitized.length < length) {
      focusCell(sanitized.length);
    }
  };

  const applyClipboardCode = React.useCallback(
    (clipboardText: string) => {
      const sanitized = sanitize(clipboardText).slice(0, length);
      if (sanitized.length !== length) return;

      const currentJoined = cells.join("");
      if (
        currentJoined === sanitized ||
        lastAutoFilledValue.current === sanitized
      ) {
        return;
      }

      const nextCells = normalizeToCells(sanitized);
      setCells(nextCells);
      emitChange(nextCells);
      lastAutoFilledValue.current = sanitized;
      inputRefs.current[length - 1]?.blur();
    },
    [cells, emitChange, length, normalizeToCells, sanitize]
  );

  useEffect(() => {
    const readClipboardAndApply = async () => {
      try {
        const clipboardText = await Clipboard.getString();
        if (!clipboardText) return;

        // Prefer not to override a fully entered code while user is interacting.
        if (cells.join("").length >= length) return;

        applyClipboardCode(clipboardText);
      } catch {
        // Ignore clipboard access failures.
      }
    };

    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasInBackground =
        appStateRef.current === "background" ||
        appStateRef.current === "inactive";

      if (wasInBackground && nextState === "active") {
        void readClipboardAndApply();
      }

      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [cells, length, normalizeToCells, sanitize, applyClipboardCode]);

  return (
    <View
      style={{
        width: "100%"
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "nowrap",
          rowGap: Spacing.LEVEL_1,
          columnGap: Spacing.LEVEL_1,
          borderWidth: 1,
          borderColor:
            focusedIndex !== null
              ? colors.selected.accent
              : colors.primary.border,
          borderRadius: Radius.S,
          paddingVertical: Spacing.LEVEL_3,
          paddingHorizontal: Spacing.LEVEL_2
        }}
      >
        {cells.map((char, index) => {
          const isActive = focusedIndex === index;

          return (
            <TouchableOpacity
              key={`${index}`}
              activeOpacity={0.9}
              onPress={() => focusCell(index)}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderBottomWidth: 2,
                  borderBottomColor: isActive
                    ? colors.selected.accent
                    : colors.primary.shade,
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <TextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                    if (index === 0 && inputRef) {
                      inputRef.current = ref;
                    }
                  }}
                  disableFullscreenUI={true}
                  value={char}
                  maxLength={1}
                  keyboardType={keyboardType}
                  onChangeText={(text) => onCellChange(index, text)}
                  onKeyPress={(event) => onCellKeyPress(index, event)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => {
                    setFocusedIndex((current) =>
                      current === index ? null : current
                    );
                  }}
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="oneTimeCode"
                  inputMode="numeric"
                  importantForAutofill="yes"
                  selectionColor={colors.selected.accent}
                  style={{
                    width: "100%",
                    height: "100%",
                    textAlign: "center",
                    fontSize: AppFontSize.sm,
                    color: colors.primary.paragraph,
                    padding: 0,
                    margin: 0
                  }}
                  onSubmitEditing={onSubmitEditing}
                  blurOnSubmit={index === length - 1}
                  returnKeyType={index === length - 1 ? "done" : "next"}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hidden aggregate input for full-code paste/autofill and test compatibility. */}
      <TextInput
        testID={testID}
        value={cells.join("")}
        keyboardType={keyboardType}
        onChangeText={onBulkInputChange}
        maxLength={length}
        autoCorrect={false}
        autoComplete="off"
        textContentType="oneTimeCode"
        importantForAutofill="yes"
        style={{
          position: "absolute",
          opacity: 0,
          width: 1,
          height: 1
        }}
      />
    </View>
  );
};

export default PinInput;
