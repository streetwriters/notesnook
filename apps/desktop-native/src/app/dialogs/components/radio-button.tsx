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

import { Flex, Text, type SxProp } from "@ui";
import { Pro } from "../../components/icons";

type ReminderRadioButtonProps = {
  testId: string;
  label: string;
  selected: boolean;
  premium?: boolean;
  sx?: SxProp;
  onClick: () => void;
};

export function CustomRadio(props: { checked: boolean }) {
  return (
    <Flex
      sx={{
        width: 16,
        height: 16,
        flexShrink: 0,
        borderRadius: 8,
        border: "1px solid",
        borderColor: props.checked ? "accent" : "paragraph",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {props.checked ? (
        <Flex sx={{ width: 10, height: 10, borderRadius: 5, bg: "accent" }} />
      ) : null}
    </Flex>
  );
}

export function ReminderRadioButton(props: ReminderRadioButtonProps) {
  const { testId, label, selected, premium, sx, onClick } = props;
  return (
    <Flex
      testID={testId}
      onPress={premium ? undefined : onClick}
      sx={{
        minWidth: 0,
        flexDirection: "row",
        border: "1px solid",
        borderColor: selected ? "transparent" : "border",
        borderRadius: "radius2",
        py: "spacing5",
        px: "spacing4",
        flexShrink: 0,
        justifyContent: "space-between",
        alignItems: "center",
        bg: selected ? "background-selected" : "transparent",
        gap: "spacing4",
        cursor: premium ? "not-allowed" : "pointer",
        ":hover": { bg: premium ? "transparent" : "hover" },
        ...sx
      }}
    >
      {premium && <Pro size={13} />}
      <Text
        sx={{
          color: selected ? "paragraph-selected" : "paragraph",
          fontWeight: selected ? 500 : 400,
          fontSize: "sm",
          lineHeight: 1
        }}
      >
        {label}
      </Text>
      <CustomRadio checked={selected} />
    </Flex>
  );
}

export function Fieldset(props: {
  title: string;
  children: React.ReactNode;
  sx?: SxProp;
}) {
  return (
    <Flex
      sx={{
        position: "relative",
        flexDirection: "column",
        mt: "spacing7",
        p: "spacing6",
        border: "1px solid",
        borderColor: "border",
        borderRadius: "radius3",
        ...props.sx
      }}
    >
      <Text
        sx={{
          px: "spacing1",
          color: "accent",
          fontSize: "xs",
          fontWeight: 500,
          lineHeight: 1.2,
          mb: "spacing4"
        }}
      >
        {props.title}
      </Text>
      {props.children}
    </Flex>
  );
}
