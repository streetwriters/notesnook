import { Input, InputProps } from "@rebass/forms";
import { Flex, FlexProps, Text } from "rebass";

type LabelInputProps = InputProps & {
  label: string;
  containerProps?: FlexProps;
};
export function InlineInput(props: LabelInputProps) {
  const { label, containerProps, sx, ...inputProps } = props;

  return (
    <Flex
      {...containerProps}
      sx={{
        flex: 1,
        ...containerProps?.sx,
        outline: "1px solid var(--border)",
        p: 2,
        borderRadius: "default",
        ":focus-within": {
          outlineColor: "primary",
          outlineWidth: "1.8px"
        }
      }}
    >
      <Input variant={"clean"} sx={{ ...sx, p: 0 }} {...inputProps} />
      <Text
        variant={"body"}
        sx={{
          flexShrink: 0,
          color: "fontTertiary",
          borderLeft: "1px solid var(--border)",
          pl: 1
        }}
      >
        {label}
      </Text>
    </Flex>
  );
}
