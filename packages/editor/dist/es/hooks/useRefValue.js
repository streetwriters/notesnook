import { useEffect, useRef } from "react";
export function useRefValue(value) {
    const refValue = useRef(value);
    useEffect(() => {
        refValue.current = value;
    }, [value]);
    return refValue;
}
