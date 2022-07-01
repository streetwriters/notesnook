export function debounce(func, waitFor) {
    let timeout;
    const debounced = (...args) => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
    };
    return debounced;
}
