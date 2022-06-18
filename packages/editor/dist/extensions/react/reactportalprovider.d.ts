import React from "react";
import { EventDispatcher } from "./event-dispatcher";
export declare type BasePortalProviderProps = {
    render: (portalProviderAPI: PortalProviderAPI) => React.ReactChild | JSX.Element | null;
};
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
export declare class PortalProvider extends React.Component<BasePortalProviderProps> {
    static displayName: string;
    portalProviderAPI: PortalProviderAPI;
    constructor(props: BasePortalProviderProps);
    render(): React.ReactChild | JSX.Element | null;
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
