import React from "react";
import "./editor.css";
import { Flex, Text } from "rebass";
import { useStore } from "../../stores/editor-store";
import { timeConverter } from "../../utils/time";

function Footer() {
  const dateEdited = useStore((store) => store.session.dateEdited);
  const id = useStore((store) => store.session.id);
  const totalWords = useStore((store) => store.session.totalWords);
  const isSaving = useStore((store) => store.session.isSaving);
  return (
    <Flex m={2} justifyContent="flex-end" alignItems="center">
      <Text fontSize={"subBody"} color="fontTertiary">
        {id ? totalWords + " words" : "-"}
        <TextSeperator />
        {timeConverter(dateEdited) || "-"}
        <TextSeperator />
        {id ? (isSaving ? "Saving" : "Saved") : "-"}
      </Text>
    </Flex>
  );
}
export default Footer;

const TextSeperator = () => {
  return (
    <Text as="span" mx={1}>
      •
    </Text>
  );
};
