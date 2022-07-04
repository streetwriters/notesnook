import { UnionCommands } from "@tiptap/core";
export declare type Claims = "premium";
export declare type PermissionHandlerOptions = {
    claims: Record<Claims, boolean>;
    onPermissionDenied: (claim: Claims, id: keyof UnionCommands) => void;
};
export declare function usePermissionHandler(options: PermissionHandlerOptions): void;
