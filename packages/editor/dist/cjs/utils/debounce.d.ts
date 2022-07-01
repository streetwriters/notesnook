export declare function debounce<F extends (...args: any) => any>(func: F, waitFor: number): (...args: Parameters<F>) => ReturnType<F>;
