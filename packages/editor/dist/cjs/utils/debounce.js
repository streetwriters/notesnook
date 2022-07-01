"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = void 0;
function debounce(func, waitFor) {
    let timeout;
    const debounced = (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
    return debounced;
}
exports.debounce = debounce;
