export function time<T extends (...args: any[]) => any>(
  fn: T,
  started: () => void,
  ended: (durationMs: number) => void
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>) => {
    const startTime = process.hrtime();
    started();
    const res = fn(...args);
    const endTime = process.hrtime(startTime);
    const duration = (endTime[0] * 1e9 + endTime[1]) / 1e6; // Convert to milliseconds
    ended(duration);
    return res;
  };
}