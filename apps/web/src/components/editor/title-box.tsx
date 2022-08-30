/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect, useState } from "react";
import { Input } from "@streetwriters/rebass-forms";

type TitleBoxProps = {
  nonce?: number;
  readonly: boolean;
  title: string;
  setTitle: (title: string) => void;
};

function TitleBox(props: TitleBoxProps) {
  const { readonly, setTitle, title, nonce } = props;
  const [currentTitle, setCurrentTitle] = useState<string>("");

  useEffect(
    () => {
      setCurrentTitle(title);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nonce]
  );

  return (
    <Input
      value={currentTitle}
      variant="clean"
      data-test-id="editor-title"
      className="editorTitle"
      placeholder={"Note title"}
      width="100%"
      readOnly={readonly}
      sx={{
        p: 0,
        fontFamily: "heading",
        fontSize: ["1.625em", "1.625em", "2.625em"],
        fontWeight: "heading"
      }}
      onChange={(e) => {
        setCurrentTitle(e.target.value);
        setTitle(e.target.value);
      }}
    />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return (
    prevProps.readonly === nextProps.readonly &&
    prevProps.nonce === nextProps.nonce
  );
});
