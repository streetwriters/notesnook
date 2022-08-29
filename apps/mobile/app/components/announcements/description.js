import React from "react";
import { SIZE } from "../../utils/size";
import Paragraph from "../ui/typography/paragraph";
import { getStyle } from "./functions";

export const Description = ({ text, style = {}, inline }) => {
  return (
    <Paragraph
      style={{
        marginHorizontal: 12,
        ...getStyle(style),
        textAlign: inline ? "left" : style?.textAlign
      }}
      size={inline ? SIZE.sm : SIZE.md}
    >
      {text}
    </Paragraph>
  );
};
