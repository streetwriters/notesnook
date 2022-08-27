import { UnionCommands } from "@tiptap/core";
import { useEffect } from "react";
import { PermissionRequestEvent } from "../types";

export type Claims = "premium";
export type PermissionHandlerOptions = {
  claims: Record<Claims, boolean>;
  onPermissionDenied: (claim: Claims, id: keyof UnionCommands) => void;
};

const ClaimsMap: Record<Claims, (keyof UnionCommands)[]> = {
  premium: ["insertImage"]
};

export function usePermissionHandler(options: PermissionHandlerOptions) {
  const { claims, onPermissionDenied } = options;

  useEffect(() => {
    function onPermissionRequested(ev: Event) {
      const {
        detail: { id }
      } = ev as PermissionRequestEvent;

      for (const key in ClaimsMap) {
        const claim = key as Claims;
        const commands = ClaimsMap[claim];

        if (commands.indexOf(id) <= -1) continue;
        if (claims[claim]) continue;

        onPermissionDenied(claim, id);
        ev.preventDefault();
        break;
      }

      ev.preventDefault();
    }
    window.addEventListener("permissionrequest", onPermissionRequested);
    return () => {
      window.removeEventListener("permissionrequest", onPermissionRequested);
    };
  }, [claims, onPermissionDenied]);
}
