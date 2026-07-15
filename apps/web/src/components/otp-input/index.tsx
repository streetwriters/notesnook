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
  useCallback,
  useRef,
  useEffect,
  KeyboardEvent,
  ClipboardEvent
} from "react";
import { Flex, Input } from "@notesnook/ui";

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
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const char = e.target.value.replace(/\D/g, "").slice(-1);
      if (!char) return;

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
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
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
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
        return;
      }

      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        return;
      }
    },
    [value, length, onChange]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
      const newValue = Array.from({ length }, (_, i) => pasted[i] || value[i] || "");
      onChange(newValue.join(""));
    },
    [length, onChange, value]
  );

  return (
    <Flex
      sx={{
        gap: "15px",
        justifyContent: "center",
        width: "100%"
      }}
    >
      {Array.from({ length }, (_, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete="one-time-code"
          value={value[index] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
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
            outline: "none",
            "&:focus": {
              borderColor: "accent",
              boxShadow: "0 0 0 1px var(--accent)"
            },
            "-moz-appearance": "textfield",
            "::-webkit-inner-spin-button": {
              "-webkit-appearance": "none"
            },
            "::-webkit-outer-spin-button": {
              "-webkit-appearance": "none"
            }
          }}
        />
      ))}
      <input name="code" type="hidden" value={value} onChange={() => {}} />
    </Flex>
  );
}
