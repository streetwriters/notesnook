import React, { PropsWithChildren } from "react";
import { FlexProps } from "rebass";
export declare type TabProps = {
    title: string | React.ReactElement;
};
export declare function Tab(props: PropsWithChildren<TabProps>): JSX.Element;
export declare type TabsProps = {
    activeIndex: number;
    containerProps?: FlexProps;
    onTabChanged?: (index: number) => void;
};
export declare function Tabs(props: PropsWithChildren<TabsProps>): JSX.Element;
