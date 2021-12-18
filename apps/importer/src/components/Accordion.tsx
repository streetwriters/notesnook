import { Flex, FlexProps, Text } from "@theme-ui/components";
import { PropsWithChildren, useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

type AccordionProps = FlexProps & {
  title: string;
  color?: string;
};
export function Accordion({
  title,
  children,
  sx,
  color,
  ...restProps
}: PropsWithChildren<AccordionProps>) {
  const [isContentHidden, setIsContentHidden] = useState<boolean>(true);
  return (
    <Flex sx={{ flexDirection: "column", ...sx }} {...restProps}>
      <Flex
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
          cursor: "pointer",
        }}
        onClick={() => {
          setIsContentHidden((state) => !state);
        }}
      >
        <Text variant="subtitle" sx={{ color }}>
          {title}
        </Text>
        {isContentHidden ? (
          <IoChevronDown size={16} color={color} />
        ) : (
          <IoChevronUp size={16} color={color} />
        )}
      </Flex>
      {!isContentHidden && children}
    </Flex>
  );
}
