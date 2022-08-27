export function debounce<F extends (...args: unknown[]) => unknown>(
  func: F,
  waitFor: number
) {
  let timeout: NodeJS.Timeout | null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced;
}
