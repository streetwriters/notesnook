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

import { Input } from "@theme-ui/components";
import { Flex } from "@theme-ui/components";
import { useRefValue } from "../../hooks/use-ref-value";
import { Popup } from "../components/popup";
import { LinkDefinition } from "../tools/link";

export type LinkPopupProps = {
  link?: LinkDefinition;
  isEditing?: boolean;
  onDone: (link: LinkDefinition) => void;
  onClose: () => void;
  isImageActive?: boolean;
};
export function LinkPopup(props: LinkPopupProps) {
  const {
    link: _link = { title: "", href: "" },
    isEditing = false,
    onDone,
    onClose,
    isImageActive
  } = props;
  const link = useRefValue(_link);

  return (
    <Popup
      title={isEditing ? "Edit link" : "Insert link"}
      onClose={onClose}
      action={{
        title: isEditing ? "Save edits" : "Insert link",
        onClick: () => {
          if (!link.current) return;
          onDone(link.current);
        }
      }}
    >
      <Flex sx={{ p: 1, flexDirection: "column", width: ["auto", 250] }}>
        {!isImageActive && (
          <Input
            type="text"
            placeholder="Link text"
            defaultValue={link.current?.title}
            sx={{ mb: 1 }}
            onChange={(e) =>
              (link.current = {
                ...link.current,
                title: e.target.value
              })
            }
          />
        )}
        <Input
          type="url"
          autoFocus
          placeholder="https://example.com/"
          defaultValue={link.current?.href}
          onChange={(e) =>
            (link.current = { ...link.current, href: e.target.value })
          }
        />
      </Flex>
    </Popup>
  );
}
