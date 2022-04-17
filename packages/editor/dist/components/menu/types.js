// export type ResolverFunction<T, TData> = (
//   data: any,
//   item: MenuItem<TData>
// ) => T;
// export type Resolvable<T, TData> = T | ResolverFunction<T, TData>;
// export type MenuItem<TData> = {
//   type: "menuitem" | "seperator";
//   key: string;
//   component?: Resolvable<(props: any) => JSX.Element, TData>;
//   onClick?: (data: TData, item: MenuItem<TData>) => void;
//   title?: Resolvable<string, TData>;
//   icon?: Resolvable<string, TData>;
//   tooltip?: Resolvable<string, TData>;
//   disabled?: Resolvable<string, TData>;
//   hidden?: Resolvable<boolean, TData>;
//   checked?: Resolvable<boolean, TData>;
//   modifier?: Resolvable<string[], TData>;
//   items?: Resolvable<MenuItem<TData>[], TData>;
// };
export {};
