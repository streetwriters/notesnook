import { Text } from "rebass";

function TextWithTip({ text, tip, sx, color }) {
  return (
    <Text color={color || "text"} fontSize="body" sx={sx}>
      {text}
      <Text color={"fontTertiary"} fontSize="subBody">
        {tip}
      </Text>
    </Text>
  );
}
export default TextWithTip;
