import { OutputChannel, window } from 'vscode';
import { time } from '../../utils/std/timer';

let _channel: OutputChannel;
export const getOutputChannel = () => {
  if (!_channel) {
    _channel = window.createOutputChannel('Line Note Plus');
  }
  return _channel;
}
getOutputChannel().show(true);

const _timer = <T extends (...args: any[]) => any>(name: string, fn: T): (...args: Parameters<T>) => ReturnType<T> => {
  return time(
    fn, 
    () => null,
    dms => getOutputChannel().appendLine(`[${name}]: ${dms}ms`)
  )
}
export const log = {
  time: _timer,
}