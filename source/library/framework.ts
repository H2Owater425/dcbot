import { ClientEvents, ClientOptions, Command as _Command, CommandClient, CommandClientOptions, CommandGenerator, CommandOptions, CommandRequirements, Constants, GenericCheckFunction } from 'eris';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { EventHandler } from '@library/type';
import logger from './logger';

function getPaths(path: string, paths: string[] = []): string[] {
	const _paths: string[] = readdirSync(path, 'utf8');

	for(let i: number = 0; i < _paths['length']; i++) {
		const absolutePath: string = join(path, _paths[i]);

		if(statSync(absolutePath).isDirectory()) {
			getPaths(absolutePath, paths);
		} else {
			paths.push(absolutePath);
		}
	}

	return paths;
}

export class Event<K extends keyof ClientEvents> {
	public name: K;
	public handler: EventHandler<K>;

	constructor(name: Event<K>['name'], handler: Event<K>['handler']) {
		this['name'] = name;
		this['handler'] = handler;

		return;
	}
}

export class Command {
	public label: string;
	public generator: CommandGenerator;
	public options: Omit<CommandOptions, 'requirements'> & { requirements?: Omit<CommandRequirements, 'permissions'> & { permissions?: Partial<Record<keyof Constants["Permissions"], boolean>> | GenericCheckFunction<Record<string, boolean>> } };
	private subcommands: Command[] = [];

	constructor(label: Command['label'], generator: Command['generator'], options: Command['options'] = {}) {
		this['label'] = label;
		this['generator'] = generator;
		this['options'] = options;
	}

	public addSubcommand(command: Command): this {
		this['subcommands'].push(command);

		return this;
	}

	public registerSubcommand(command: _Command): void {
		for(let i: number = 0; i < this['subcommands']['length']; i++) {
			const subcommand: _Command = command.registerSubcommand(this['subcommands'][i]['label'], this['subcommands'][i]['generator'], this['subcommands'][i]['options']);

			if(this['subcommands'][i]['subcommands']['length'] !== 0) {
				this['subcommands'][i].registerSubcommand(subcommand);
			}
		}

		return;
	}
}

export class Client extends CommandClient {
	private fileExtension: string = __filename.slice(-3);
	public commandLabelAndAliases: Set<string> = new Set<string>();
	public commandLabels: string[] = [];

	constructor(token: string, options: ClientOptions & CommandClientOptions) {
		super(token, options, options);
	}

	public loadCommand(path: string): void {
		const commandPaths: string[] = getPaths(path);

		for(let i: number = 0; i < commandPaths['length']; i++) {
			if(commandPaths[i].endsWith(this['fileExtension'])) {
				const command: Command = require(commandPaths[i])['default'];

				command.registerSubcommand(this.registerCommand(command['label'], command['generator'], command['options']));

				this['commandLabels'].push(command['label']);
				this['commandLabelAndAliases'].add(command['label']);
				
				if(Array.isArray(command['options']['aliases'])) {
					for(let j: number = 0; j < command['options']['aliases']['length']; j++) {
						this['commandLabelAndAliases'].add(command['options']['aliases'][j]);
					}
				}
			}
		}

		return;
	}

	public loadEvent(path: string): void {
		const eventPaths: string[] = getPaths(path);

		for(let i: number = 0; i < eventPaths['length']; i++) {
			if(eventPaths[i].endsWith(this['fileExtension'])) {
				const event: Event<keyof ClientEvents> = require(eventPaths[i])['default'];

				this.on(event['name'], event['handler']);
			}
		}

		return;
	}

	private getCommandTreePrintouts(commands: _Command[] = Object.values(this['commands']), depth: number = 1, isLastBranch: boolean = false): string[] {
		let printouts: string[] = [];
		
		for(let i: number = 0; i < commands['length']; i++) {
			const isLastElement: boolean = i + 1 === commands['length'];

			let printout: string = '';
			
			for(let j: number = 1 + (isLastBranch ? 1 : 0); j < depth; j++) {
				printout += '│   ';
			}

			if(isLastBranch) {
				printout += '    ';
			}

			printout += (!isLastElement ? '├' : '└') + '── ' + commands[i]['label'];

			if(commands[i]['aliases']['length'] !== 0) {
				printout += ' (' + commands[i]['aliases'].join(', ') + ')';
			}

			printouts.push(printout);

			if(Object.keys(commands[i]['subcommands'])['length'] !== 0) {
				printouts = printouts.concat.apply(printouts, this.getCommandTreePrintouts(Object.values(commands[i]['subcommands']), depth + 1, isLastElement));
			}
		}

		return printouts;
	}

	public printCommandTree(): void {
		const commandPrintouts: string[] = this.getCommandTreePrintouts();
		
		logger.info(process['env']['PREFIX'] + ' [PREFIX]');

		for(let i: number = 0; i < commandPrintouts['length']; i++) {
			logger.info(commandPrintouts[i]);
		}

		return;
	}

	public printEventTree(): void {
		const eventNames: (string | Symbol)[] = this.eventNames();

		logger.info('Connect')

		for(let i: number = 0; i < eventNames['length']; i++) {
			if(typeof(eventNames[i]) === 'string') {
				logger.info((i + 1 !== eventNames['length'] ? '├' : '└') + '── ' + eventNames[i]);
			}
		}
	}
}