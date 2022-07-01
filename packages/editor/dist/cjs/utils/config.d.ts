declare function set<T>(key: string, value: T | null): void;
declare function get<T>(key: string, def?: T): T | undefined;
export declare const config: {
    set: typeof set;
    get: typeof get;
};
export {};
