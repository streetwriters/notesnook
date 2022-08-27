import Paragraph from "../ui/typography/paragraph";
import { getStyle } from "./functions";

export const Body = ({ text, style = {} }) => {
  return (
    <Paragraph
      style={{
        paddingHorizontal: 12,
        ...getStyle(style)
      }}
    >
      {text}
    </Paragraph>
  );
};
