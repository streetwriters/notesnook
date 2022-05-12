import { PropsWithChildren } from "react";
declare type ResponsiveContainerProps = {
    mobile?: JSX.Element;
    desktop?: JSX.Element;
};
export declare function ResponsiveContainer(props: ResponsiveContainerProps): JSX.Element | null;
export declare function DesktopOnly(props: PropsWithChildren<{}>): JSX.Element;
export declare function MobileOnly(props: PropsWithChildren<{}>): JSX.Element;
export {};
