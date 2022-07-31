import { client } from "@application";
import { pageSize } from "@library/constant";
import { Command } from "@library/framework";
import logger from "@library/logger";
import { getHelpEmbed } from "@library/utility";
import { Command as _Command, EmbedField, EmbedOptions, Message } from "eris";

export default new Command('!help', function (message: Message, _arguments: string[]): void {
	if(_arguments['length'] !== 0) {
		if(_arguments[0].startsWith(process['env']['PREFIX'])) {
			_arguments[0] = _arguments[0].slice(process['env']['PREFIX']['length']);

			let currentCommand: _Command | undefined = client['commands'][typeof(client['commandAliases'][_arguments[0]]) !== 'undefined' ? client['commandAliases'][_arguments[0]] : _arguments[0]];
	
			if(typeof(currentCommand) === 'object') {
				const argumentCommand: string = _arguments.join(' ');
				const helpEmbed: EmbedOptions = {
					color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
					thumbnail: { url: 'https://cdn.h2owr.xyz/images/dcbot/logo.png' },
					title: 'DCBot | 도움',
					fields: [{
						name: '사용법',
						value: process['env']['PREFIX'] + argumentCommand,
						inline: true
					}]
				};
	
				let aliases: string[] = ([] as string[]).concat(currentCommand['aliases'], currentCommand['label']);
	
				for(let i: number = 1; i < _arguments['length']; i++) {
					currentCommand = currentCommand['subcommands'][typeof(currentCommand['subcommandAliases'][_arguments[i]]) !== 'undefined' ? currentCommand['subcommandAliases'][_arguments[i]] : _arguments[i]];
					
					if(typeof(currentCommand) === 'object') {
						const aliasesLength: number = aliases['length'];
	
						for(let j: number = 0; j < aliasesLength; j++) {
							for(let k: number = 0; k < currentCommand['aliases']['length']; k++) {
								aliases.push(aliases[j] + ' ' + currentCommand['aliases'][k]);
							}
	
							aliases[j] += ' ' + currentCommand['label'];
						}
	
					} else {
						return;
					}
				}

				if(currentCommand['usage']['length'] !== 0) {
					(helpEmbed['fields'] as EmbedField[])[0]['value'] += ' ' + currentCommand['usage'];
				}
	
				(helpEmbed['fields'] as EmbedField[]).push({
					name: '설명',
					value: currentCommand['description'],
					inline: true
				});
	
				aliases.sort();

				(helpEmbed['fields'] as EmbedField[]).push({
					name: '별칭',
					value: '',
					inline: true
				});

				for(let i: number = 0; i < aliases['length']; i++) {
					if(argumentCommand !== aliases[i]) {
						(helpEmbed['fields'] as EmbedField[])[2]['value'] += process['env']['PREFIX'] + aliases[i] + '\n';
					}
				}

				(helpEmbed['fields'] as EmbedField[])[2]['value'] = (helpEmbed['fields'] as EmbedField[])[2]['value'].slice(0, -1);

				if((helpEmbed['fields'] as EmbedField[])[2]['value']['length'] === 0) {
					(helpEmbed['fields'] as EmbedField[])[2]['value'] = 'No aliases';
				}
	
				message['channel'].createMessage({
					embed: helpEmbed,
					messageReference: { messageID: message['id'] }
				})
				.catch(logger.error);
			}
		}
	} else {
		message['channel'].createMessage({
			embed: getHelpEmbed(0, pageSize),
			messageReference: { messageID: message['id'] }
		})
		.then(function (message: Message): void {
			message.addReaction('◀')
			.then(function (): void {
				message.addReaction('▶')
				.catch(logger.error);

				return;
			})
			.catch(logger.error);

			return;
		})
		.catch(logger.error);
	}
	
	return;
}, {
	aliases: ['!도움'],
	guildOnly: true
});