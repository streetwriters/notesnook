export function debounce<F extends (...args: any) => any>(
  func: F,
  waitFor: number
) {
  let timeout: NodeJS.Timeout | null;

  const debounced = (...args: any) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}
