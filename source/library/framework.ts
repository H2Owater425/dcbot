import { ClientEvents, ClientOptions, Command as _Command, CommandClient, CommandClientOptions, CommandGenerator, CommandOptions } from 'eris';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { EventHandler } from '@library/type';

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
	public options: CommandOptions & { subcommands?: Command[] };

	constructor(label: Command['label'], generator: Command['generator'], options: Command['options'] = {}) {
		this['label'] = label;
		this['generator'] = generator;
		this['options'] = options;
	}

	public registerSubcommand(command: _Command): void {
		if(Array.isArray(this['options']['subcommands'])) {
			for(let i: number = 0; i < this['options']['subcommands']['length']; i++) {
				this['options']['subcommands'][i].registerSubcommand(command.registerSubcommand(this['options']['subcommands'][i]['label'], this['options']['subcommands'][i]['generator'], this['options']['subcommands'][i]['options']));
			}
		}
	}
}

export class Client extends CommandClient {
	private _commandNames: Set<string> = new Set<string>();
	private currentFileExtension: string = __filename.slice(-3);

	constructor(token: string, options: ClientOptions & CommandClientOptions) {
		super(token, options, options);
	}

	public get commandNames(): Client['_commandNames'] {
		return new Set<string>(this['_commandNames']);
	} 

	public loadCommand(path: string): void {
		const commandPaths: string[] = getPaths(path);

		for(let i: number = 0; i < commandPaths['length']; i++) {
			if(commandPaths[i].endsWith(this['currentFileExtension'])) {
				const command: Command = require(commandPaths[i])['default'];

				command.registerSubcommand(this.registerCommand(command['label'], command['generator'], command['options']));

				this['_commandNames'].add(command['label']);

				if(Array.isArray(command['options']['aliases'])) {
					for(let j: number = 0; j < command['options']['aliases']['length']; j++) {
						this['_commandNames'].add(command['options']['aliases'][j]);
					}
				}
			}
		}

		return;
	}

	public loadEvent(path: string): void {
		const eventPaths: string[] = getPaths(path);

		for(let i: number = 0; i < eventPaths['length']; i++) {
			if(eventPaths[i].endsWith(this['currentFileExtension'])) {
				const event: Event<keyof ClientEvents> = require(eventPaths[i])['default'];

				this.on(event['name'], event['handler']);
			}
		}

		return;
	}
}