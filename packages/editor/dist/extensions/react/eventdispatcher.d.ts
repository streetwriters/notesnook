import { PluginKey } from "prosemirror-state";
export interface Listeners {
    [name: string]: Set<Listener>;
}
export declare type Listener<T = any> = (data: T) => void;
export declare type Dispatch<T = any> = (eventName: PluginKey | string, data: T) => void;
export declare class EventDispatcher<T = any> {
    private listeners;
    on(event: string, cb: Listener<T>): void;
    off(event: string, cb: Listener<T>): void;
    emit(event: string, data: T): void;
    destroy(): void;
}
/**
 * Creates a dispatch function that can be called inside ProseMirror Plugin
 * to notify listeners about that plugin's state change.
 */
export declare function createDispatch<T>(eventDispatcher: EventDispatcher<T>): Dispatch<T>;
