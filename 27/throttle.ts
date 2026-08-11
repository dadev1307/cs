export function throttle(callback: Function, delay: number = 300) {
  let lastArgs: any[] | null = null;
  let lastThis: unknown | null = null;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(this: unknown, ...args: any[]) {
    if (timerId) {
      lastThis = this;
      lastArgs = args;
      return;
    }

    callback.apply(this, args);

    timerId = setTimeout(() => {
      timerId = null;

      if (lastArgs) {
        throttled.apply(lastThis, lastArgs);
        lastThis = null;
        lastArgs = null;
      }
    }, delay);
  };
}
