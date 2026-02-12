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

import React from "react";
import { AppFontSize } from "../../utils/size";
import Paragraph from "../ui/typography/paragraph";
import { BodyItemProps, getStyle } from "./functions";
import { DefaultAppStyles } from "../../utils/styles";

export const Description = (props: BodyItemProps) => {
  return (
    <Paragraph
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        ...getStyle(props.item.style),
        textAlign: props.inline ? "left" : props.item.style?.textAlign
      }}
      size={AppFontSize.sm}
    >
      {props.item.text}
    </Paragraph>
  );
};
