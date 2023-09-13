/** 
 * David Walsh (https://davidwalsh.name/javascript-debounce-function)
*/
export interface DebounceProps {
  /** the function to debounce */
  func: (...args: any[]) => any,
  /** time ms to wait */
  wait: number,
}
export const debounce = ({
  func,
  wait,
}: DebounceProps) => {
  let timeout: NodeJS.Timer;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
