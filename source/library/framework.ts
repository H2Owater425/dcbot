import { ClientEvents, ClientOptions, Command as _Command, CommandClient, CommandClientOptions, CommandGenerator, CommandOptions, CommandRequirements, Constants, GenericCheckFunction } from 'eris';
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
			command.registerSubcommand(this['subcommands'][i]['label'], this['subcommands'][i]['generator'], this['subcommands'][i]['options']);
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
}