import { Socket } from 'net';
import { inspect } from 'util';

export class Logger {
	static log(level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace', _arguments: unknown[]): void {
		for(let i: number = 0; i < _arguments['length']; i++) {
			if(typeof(_arguments[i]) === 'object') {
				_arguments[i] = inspect(_arguments[i]);
			}
		}

		let print: Socket['write'] = process.stdout.write.bind(process.stdout);
		let levelColor: number = 32;

		switch(level) {
			case 'error':
			case 'fatal': {
				print = process.stderr.write.bind(process.stderr);
				levelColor--;

				break;
			}

			case 'warn': {
				levelColor++;
			}
		}

		print('[\x1b[36m' + (new Date()).toTimeString().slice(0, 8) + '\x1b[37m][\x1b[' + levelColor + 'm' + level.toUpperCase() + '\x1b[37m] ' + _arguments.join(' ') + '\n');
	}

  public info(..._arguments: unknown[]): void {
		Logger.log('info', _arguments);

		return;
	}

  public warn(..._arguments: unknown[]): void {
		Logger.log('warn', _arguments);

		return;
	}

  public error(..._arguments: unknown[]): void {
		Logger.log('error', _arguments);

		return;
	}

  public fatal(..._arguments: unknown[]): void {
		Logger.log('fatal', _arguments);

		return;
	}

  public trace(..._arguments: unknown[]): void {
		Logger.log('trace', _arguments);

		return;
	}

  public debug(..._arguments: unknown[]): void {
		Logger.log('debug', _arguments);

		return;
	}
}

export default new Logger();