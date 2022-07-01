import React, { PropsWithChildren } from "react";
import { EventDispatcher } from "./event-dispatcher";
export declare type BasePortalProviderProps = PropsWithChildren<{}>;
export declare type Portals = Map<HTMLElement, React.ReactChild>;
export declare type PortalRendererState = {
    portals: Portals;
};
declare type MountedPortal = {
    children: () => React.ReactChild | null;
};
export declare class PortalProviderAPI extends EventDispatcher {
    portals: Map<HTMLElement, MountedPortal>;
    context: any;
    constructor();
    setContext: (context: any) => void;
    render(children: () => React.ReactChild | JSX.Element | null, container: HTMLElement): void;
    forceUpdate(): void;
    remove(container: HTMLElement): void;
}
export declare function usePortalProvider(): PortalProviderAPI | undefined;
export declare class PortalProvider extends React.Component<BasePortalProviderProps> {
    static displayName: string;
    portalProviderAPI: PortalProviderAPI;
    constructor(props: BasePortalProviderProps);
    render(): JSX.Element;
    componentDidUpdate(): void;
}
export declare class PortalRenderer extends React.Component<{
    portalProviderAPI: PortalProviderAPI;
}, PortalRendererState> {
    constructor(props: {
        portalProviderAPI: PortalProviderAPI;
    });
    handleUpdate: (portals: Portals) => void;
    render(): JSX.Element;
}
export {};
