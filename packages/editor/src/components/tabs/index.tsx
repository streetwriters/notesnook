import React, { Children, PropsWithChildren, useMemo, useState } from "react";
import { Button, Flex, FlexProps } from "rebass";

export type TabProps = { title: string | React.ReactElement };
export function Tab(props: PropsWithChildren<TabProps>) {
  return <>{props.children}</>;
}

export type TabsProps = {
  activeIndex: number;
  containerProps?: FlexProps;
  onTabChanged?: (index: number) => void;
};
export function Tabs(props: PropsWithChildren<TabsProps>) {
  const { activeIndex, children, containerProps, onTabChanged } = props;
  const [activeTab, setActiveTab] = useState(activeIndex || 0);

  const tabs = useMemo(
    () =>
      Children.map(children, (child) => {
        if (React.isValidElement(child))
          return { title: child.props.title, component: child };
      }),
    [children]
  );

  return (
    <Flex sx={{ flexDirection: "column" }}>
      <Flex
        sx={{
          mb: 1
        }}
      >
        {tabs?.map((tab, index) => (
          <Button
            key={index.toString()}
            sx={{
              flex: 1,
              p: 0,
              py: 1,
              borderRadius: 0,
              borderTopLeftRadius: "default",
              borderTopRightRadius: "default",
              bg: activeTab === index ? "bgSecondary" : "transparent",
              fontWeight: activeTab === index ? "bold" : "normal",
              color: "text",
              ":last-of-type": { mr: 0 },
              borderBottom: "2px solid",
              borderBottomColor:
                activeTab === index ? "primary" : "transparent",
              ":hover": {
                bg: "hover"
              }
            }}
            onClick={() => {
              setActiveTab(index);
              onTabChanged?.(index);
            }}
          >
            {tab.title}
          </Button>
        ))}
      </Flex>
      <Flex {...containerProps}>{tabs && tabs[activeTab].component}</Flex>
    </Flex>
  );
}
