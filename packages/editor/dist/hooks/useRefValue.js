import { useEffect, useRef } from "react";
export function useRefValue(value) {
    var refValue = useRef(value);
    useEffect(function () {
        refValue.current = value;
    }, [value]);
    return refValue;
}
