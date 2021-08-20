import { Text } from "rebass";

function TextWithTip({ text, tip, sx, color }) {
  return (
    <Text color={color || "text"} fontSize="body" sx={sx}>
      {text}
      <Text
        color={"fontTertiary"}
        fontSize="subBody"
        sx={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}
      >
        {tip}
      </Text>
    </Text>
  );
}
export default TextWithTip;
