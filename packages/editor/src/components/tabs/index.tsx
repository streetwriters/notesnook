/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import React, { Children, PropsWithChildren, useMemo, useState } from "react";
import { Button, Flex, FlexProps } from "@theme-ui/components";
import { EmotionThemeVariant } from "@notesnook/theme";

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
        <EmotionThemeVariant variant="secondary">
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
                bg: activeTab === index ? "background" : "transparent",
                fontWeight: activeTab === index ? "bold" : "normal",
                color: "text",
                ":last-of-type": { mr: 0 },
                borderBottom: "2px solid",
                borderBottomColor:
                  activeTab === index ? "accent" : "transparent",
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
        </EmotionThemeVariant>
      </Flex>
      <Flex {...containerProps}>{tabs && tabs[activeTab].component}</Flex>
    </Flex>
  );
}
