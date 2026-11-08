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

import { useCallback, useEffect, useRef } from "react";
import { Flex, Input, type KeyEvent, type UIElement } from "@ui";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  type?: "number" | "text";
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  autoFocus = true,
  disabled = false
}: OtpInputProps) {
  const inputRefs = useRef<(UIElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (index: number, text: string) => {
      const digits = text.replace(/\D/g, "");
      if (!digits) return;

      if (digits.length > 1) {
        const newValue = Array.from(
          { length },
          (_, i) => digits[i - index] || value[i] || ""
        );
        for (let i = 0; i < index; i++) newValue[i] = value[i] || "";
        onChange(newValue.join(""));
        inputRefs.current[Math.min(length - 1, index + digits.length)]?.focus();
        return;
      }

      const char = digits.slice(-1);
      const newValue = Array.from({ length }, (_, i) => value[i] || "");
      newValue[index] = char;
      onChange(newValue.join(""));

      if (index < length - 1) {
        const next = inputRefs.current[index + 1];
        if (next) next.focus();
      }
    },
    [value, length, onChange]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        const newValue = Array.from({ length }, (_, i) => value[i] || "");
        if (newValue[index]) {
          newValue[index] = "";
          onChange(newValue.join(""));
        } else if (index > 0) {
          newValue[index - 1] = "";
          onChange(newValue.join(""));
          const prev = inputRefs.current[index - 1];
          if (prev) prev.focus();
        }
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (index > 0) inputRefs.current[index - 1]?.focus();
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (index < length - 1) inputRefs.current[index + 1]?.focus();
        return;
      }

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        return;
      }
    },
    [value, length, onChange]
  );

  return (
    <Flex
      sx={{
        flexDirection: "row",
        gap: 15,
        justifyContent: "flex-start",
        width: "100%"
      }}
    >
      {Array.from({ length }, (_, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          testID={`otp-input-${index}`}
          type="text"
          value={value[index] || ""}
          disabled={disabled}
          selectTextOnFocus
          onChangeText={(text) => handleChange(index, text)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          sx={{
            width: 45,
            height: 45,
            textAlign: "center",
            fontSize: "md",
            fontWeight: 500,
            color: "heading",
            bg: "background",
            borderRadius: "radius1",
            border: "1px solid",
            borderColor: "border",
            p: 0,
            ":focus": { borderColor: "accent" }
          }}
        />
      ))}
    </Flex>
  );
}
