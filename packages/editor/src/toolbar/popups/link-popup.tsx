import { Input } from "@rebass/forms";
import { useState } from "react";
import { Flex, Button } from "rebass";
import { useRefValue } from "../../hooks/use-ref-value";
import { Popup } from "../components/popup";
import { LinkDefinition } from "../tools/link";

export type LinkPopupProps = {
  link?: LinkDefinition;
  isEditing?: boolean;
  onDone: (link: LinkDefinition) => void;
  onClose: () => void;
};
export function LinkPopup(props: LinkPopupProps) {
  const { link: _link, isEditing = false, onDone, onClose } = props;
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
        },
      }}
    >
      <Flex sx={{ p: 1, flexDirection: "column", width: ["auto", 250] }}>
        {!link.current?.isImage && (
          <Input
            type="text"
            placeholder="Link text"
            defaultValue={link.current?.text}
            sx={{ mb: 1 }}
            onChange={(e) =>
              (link.current = { ...link.current, text: e.target.value })
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
