import { Input } from "@rebass/forms";
import { useState } from "react";
import { Flex, Button } from "rebass";
import { Popup } from "../components/popup";

export type LinkPopupProps = {
  text?: string;
  href?: string;
  isEditing?: boolean;
  onDone: (link: { text: string; href: string }) => void;
  onClose: () => void;
};
export function LinkPopup(props: LinkPopupProps) {
  const {
    text: _text,
    href: _href,
    isEditing = false,
    onDone,
    onClose,
  } = props;
  const [href, setHref] = useState<string>(_href || "");
  const [text, setText] = useState<string>(_text || "");

  return (
    <Popup
      title={isEditing ? "Edit link" : "Insert link"}
      onClose={onClose}
      action={{
        title: isEditing ? "Save edits" : "Insert link",
        onClick: () => onDone({ text, href }),
      }}
    >
      <Flex sx={{ p: 1, flexDirection: "column", width: ["auto", 250] }}>
        <Input
          type="text"
          placeholder="Link text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Input
          type="url"
          sx={{ mt: 1 }}
          autoFocus
          placeholder="https://example.com/"
          value={href}
          onChange={(e) => setHref(e.target.value)}
        />
      </Flex>
    </Popup>
  );
}
