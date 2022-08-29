export function debounce<F extends (...args: never[]) => void>(
  func: F,
  waitFor: number
) {
  let timeout: number | null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor) as unknown as number;
  };

  return debounced;
}
