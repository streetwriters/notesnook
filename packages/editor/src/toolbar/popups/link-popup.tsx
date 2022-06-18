import { Input } from "@rebass/forms";
import { useState } from "react";
import { Flex, Button } from "rebass";

export type LinkPopupProps = {
  text?: string;
  href?: string;
  isEditing?: boolean;
  onDone: (link: { text: string; href: string }) => void;
};
export function LinkPopup(props: LinkPopupProps) {
  const { text: _text, href: _href, isEditing = false, onDone } = props;
  const [href, setHref] = useState<string>(_href || "");
  const [text, setText] = useState<string>(_text || "");

  return (
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
      <Button
        variant={"primary"}
        sx={{
          alignSelf: ["stretch", "end", "end"],
          my: 1,
          mr: 1,
        }}
        onClick={() => onDone({ text, href })}
      >
        {isEditing ? "Save edits" : "Insert link"}
      </Button>
    </Flex>
  );
}
