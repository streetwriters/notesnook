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

import React, { useRef, useState } from "react";
import { EventTypes } from "../utils";
import styles from "./styles.module.css";

function Tags(): JSX.Element {
  const [tags, setTags] = useState<{ title: string; alias: string }[]>([]);
  const editorTags = useRef({
    setTags: setTags
  });

  global.editorTags = editorTags;

  const openManageTagsSheet = () => {
    if (editor?.isFocused) {
      editor.commands.blur();
      editorTitle.current?.blur();
    }
    post(EventTypes.newtag);
  };

  return (
    <div
      className={styles.container}
      style={{
        padding: "0px 12px",
        display: "flex",
        alignItems: "center",
        overflowX: "scroll",
        minHeight: "40px"
      }}
    >
      <button
        className={styles.btn}
        onClick={(e) => {
          e.preventDefault();
          openManageTagsSheet();
        }}
        style={{
          border: "1px solid var(--nn_border)",
          backgroundColor: "var(--nn_nav)",
          marginRight: 5,
          borderRadius: 100,
          padding: "0px 10px",
          fontFamily: "Open Sans",
          display: "flex",
          alignItems: "center",
          height: "30px",
          userSelect: "none",
          WebkitUserSelect: "none"
        }}
      >
        {tags.length === 0 ? (
          <p
            style={{
              marginRight: 4,
              fontSize: 13,
              color: "var(--nn_icon)",
              userSelect: "none"
            }}
          >
            Add a tag
          </p>
        ) : null}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          width="20"
          height="20"
          viewBox="0 0 24 24"
        >
          <path
            fill="var(--nn_accent)"
            d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"
          />
        </svg>
      </button>

      {tags.map((tag) => (
        <button
          key={tag.title}
          className={styles.btn}
          style={{
            border: "1px solid var(--nn_border)",
            backgroundColor: "var(--nn_nav)",
            marginRight: 5,
            borderRadius: 100,
            padding: "0px 10px",
            height: "30px",
            fontFamily: "Open Sans",
            fontSize: 13,
            color: "var(--nn_icon)",
            userSelect: "none",
            WebkitUserSelect: "none"
          }}
          onClick={(e) => {
            e.preventDefault();
            post(EventTypes.tag, tag.title);
          }}
        >
          #{tag.alias}
        </button>
      ))}
    </div>
  );
}

export default React.memo(Tags, () => true);
