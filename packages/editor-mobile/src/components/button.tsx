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

import { Editor } from "@notesnook/editor";

type ButtonType = {
  editor: Editor | null;
  title: string;
  onPress: () => void;
  marginRight?: number;
  activeKey: string;
};

export default function Button({
  editor,
  title,
  onPress,
  marginRight = 10,
  activeKey
}: ButtonType) {
  const active = editor?.isActive(activeKey);

  return (
    <button
      style={{
        width: 40,
        height: 40,
        borderWidth: 0,
        background: active
          ? "var(--nn_secondary_hover)"
          : "var(--nn_secondary_background)",
        borderRadius: 5,
        fontWeight: "bold",
        userSelect: "none",
        color: active
          ? "var(--nn_primary_paragraphmary_accent)"
          : "var(--nn_primary_paragraph)",
        marginRight: marginRight,
        fontSize: 18
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        onPress();
      }}
      onMouseDown={(e) => e.preventDefault()}
      onTouchEnd={(e) => {
        e.preventDefault();
        onPress();
      }}
      className={active ? "is-active" : ""}
    >
      {title}
    </button>
  );
}
