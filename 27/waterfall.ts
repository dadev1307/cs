export type FinalCallback = (err: any, result?: any) => void;
export type WaterfallStep = (...args: any[]) => void;

export function waterfall(
  this: unknown,
  steps: Iterable<WaterfallStep>,
  finalCallback: FinalCallback
) {
  const iterator = steps[Symbol.iterator]();
  let stepArgs: any[] = [];
  let isDone = false;

  while (!isDone) {
    const { value: step, done } = iterator.next();

    if (done) {
      isDone = true;
      finalCallback(null, ...stepArgs);
      return;
    }

    step(...stepArgs, (err: any, ...nextArgs: any[]) => {
      if (err !== null) {
        isDone = true;
        finalCallback(err);
        return;
      }

      stepArgs = nextArgs;
    });
  }
}
