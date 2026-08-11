export function debounce(callback: Function, delay: number = 300) {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: any[]) {
    if (timerId) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  };
}
