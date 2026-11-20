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

import { Flex, Input, Text } from "@ui";
import { useRefValue } from "../../hooks/use-ref-value.js";
import { Popup } from "../components/popup.js";
import { strings } from "@notesnook/intl";
import { useState } from "react";

export type LinkDefinition = {
  href: string;
  title?: string;
};

export function isInternalLink(href?: string | null) {
  return typeof href === "string" ? href.startsWith("nn://") : false;
}

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
  const [error, setError] = useState<string | null>(null);

  const handleDone = () => {
    const href = link.current?.href?.trim();
    if (!href) {
      setError(strings.enterValidUrl());
      return;
    }

    if (isInternalLink(href)) {
      onDone(link.current);
      return;
    }

    try {
      const url = new URL(href);
      onDone({ ...link.current, href: url.href });
    } catch {
      setError(strings.enterValidUrl());
    }
  };

  return (
    <Popup
      title={isEditing ? strings.editLink() : strings.insertLink()}
      onClose={onClose}
      action={{
        title: isEditing ? strings.save() : strings.insert(),
        onClick: handleDone
      }}
    >
      <Flex sx={{ p: 1, flexDirection: "column", width: ["auto", 250] }}>
        {!isImageActive && (
          <>
            <Text
              sx={{
                mb: 1,
                ml: 1,
                fontSize: "body",
                color: "paragraph"
              }}
            >
              {strings.linkText()}
            </Text>
            <Input
              type="text"
              placeholder={strings.linkText()}
              defaultValue={link.current?.title}
              sx={{ mb: 2 }}
              onChangeText={(text) =>
                (link.current = { ...link.current, title: text })
              }
              onSubmit={handleDone}
            />
          </>
        )}
        <Text
          sx={{
            mb: 1,
            ml: 1,
            fontSize: "body",
            color: "paragraph"
          }}
        >
          {strings.url()}
        </Text>
        <Input
          type="text"
          autoFocus
          placeholder="https://example.com/"
          defaultValue={link.current?.href}
          variant={error ? "error" : "input"}
          onChangeText={(text) => {
            if (error) setError(null);
            link.current = { ...link.current, href: text };
          }}
          onSubmit={handleDone}
        />
        {error && (
          <Text
            variant={"error"}
            sx={{
              bg: "background-error",
              p: 1,
              mt: 2,
              borderRadius: "default"
            }}
          >
            {error}
          </Text>
        )}
      </Flex>
    </Popup>
  );
}
