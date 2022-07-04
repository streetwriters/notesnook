"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePermissionHandler = void 0;
const react_1 = require("react");
const ClaimsMap = {
    premium: ["insertImage"],
};
function usePermissionHandler(options) {
    const { claims, onPermissionDenied } = options;
    (0, react_1.useEffect)(() => {
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
exports.usePermissionHandler = usePermissionHandler;
