import { useEffect } from "react";
const ClaimsMap = {
    premium: ["insertImage"],
};
export function usePermissionHandler(options) {
    const { claims, onPermissionDenied } = options;
    useEffect(() => {
        function onPermissionRequested(ev) {
            const { detail: { id }, } = ev;
            for (const key in ClaimsMap) {
                const claim = key;
                const commands = ClaimsMap[claim];
                if (commands.indexOf(id) <= -1)
                    continue;
                if (claims[claim])
                    continue;
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
