import { Flex, FlexProps } from "@theme-ui/components";

export function StepContainer({
  children,
  sx,
  ...restProps
}: React.PropsWithChildren<FlexProps>) {
  return (
    <Flex
      sx={{
        width: ["90%", "40%"],
        boxShadow: "0px 0px 20px 0px #00000011",
        p: 4,
        borderRadius: "default",
        ...sx,
      }}
      {...restProps}
    >
      {children}
    </Flex>
  );
}
