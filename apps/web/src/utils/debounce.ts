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

export function debounceWithId<F extends (...args: any) => any>(
  func: F,
  waitFor: number
) {
  var timeout: NodeJS.Timeout | null = null;
  var debounceId: string | null = null;

  const debounced = (id: string, ...args: any) => {
    if (timeout && id === debounceId) clearTimeout(timeout);
    debounceId = id;
    timeout = setTimeout(() => {
      func(...args);
    }, waitFor);
  };

  return debounced as (id: string, ...args: Parameters<F>) => ReturnType<F>;
}
