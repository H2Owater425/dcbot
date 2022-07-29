import { SettingIndexes, SettingNames } from "@library/constant";
import { prisma } from "@library/database";
import { Command } from "@library/framework";
import logger from "@library/logger";
import { Setting } from "@prisma/client";
import { Message } from "eris";
import { client } from "../application";

export default new Command('!setting', function (message: Message, _arguments: string[]): void {
	if(_arguments['length'] === 0) {
		prisma['setting'].findMany({
			select: {
				key: true,
				value: true
			},
			where: { guildId: message['guildID'] }
		})
		.then(function (settings: Omit<Setting, 'guildId'>[]): void {
			let settingList: string = '';
	
			for(let i: number = 0; i < settings['length']; i++) {
				settingList += SettingNames[settings[i]['key']] + ': ';
	
				switch(settings[i]['key']) {
					case SettingIndexes['hotPostChannelId']: {
						settingList += settings[i]['value'] !== '' ? '<#' + settings[i]['value'] + '>' : '**null**';
	
						break;
					}
	
					case SettingIndexes['emojiBannedChannelIds']:
					case SettingIndexes['hotPostBannedChannelIds']: {
						settingList += '**['
	
						if(settings[i]['value'] !== '') {
							settingList += '<#' + settings[i]['value'].split(',').join('>, <#') + '>'
						}
	
						settingList += ']**';
	
						break;
					}
	
					case SettingIndexes['isHotPostEnabled']:
					case SettingIndexes['isEmojiEnabled']: {
						settingList += '**' + (settings[i]['value'] === '1' ? 'true' : 'false') + '**';
						break;
					}
	
					default: {
						//hotPostCriteriaCount
						settingList += '**' + settings[i]['value'] + '**';
					}
				}
	
				settingList += '\n';
			}
	
			message['channel'].createMessage({
				embed: {
					color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
					title: 'DCBot | 설정',
					thumbnail: { url: 'https://cdn.h2owr.xyz/images/dcbot/logo.png' },
					description: settingList.slice(0, -1),
				},
				messageReference: { messageID: message['id'] }
			})
			.catch(logger.error);
	
			return;
		})
		.catch(logger.error);
	}

	return;
}, {
	aliases: ['!설정'],
	guildOnly: true,
	requirements: { permissions: { administrator: true } }
})
.addSubcommand(new Command('set', function (message: Message, _arguments: string[]): void {
	if(_arguments['length'] === 2) {
		const setting: Omit<Setting, 'guildId'> = {
			key: -1,
			value: ''
		};
	
		switch(_arguments[0]) {
			case SettingNames[SettingIndexes['isHotPostEnabled']]: {
				setting['key'] = SettingIndexes['isHotPostEnabled'];
			}
			case SettingNames[SettingIndexes['isEmojiEnabled']]: {
				if(setting['key'] === -1) {
					setting['key'] = SettingIndexes['isEmojiEnabled'];
				}
	
				switch(_arguments[1]) {
					case '1':
					case 'true': {
						setting['value'] = '1';
	
						break;
					}
	
					case '0':
					case 'false': {
						setting['value'] = '0';
	
						break;
					}
				}
	
				break;
			}
	
			case SettingNames[SettingIndexes['hotPostChannelId']]: {
				setting['key'] = SettingIndexes['hotPostChannelId'];
	
				const firstArgumantMatch: RegExpMatchArray | null = _arguments[1].match(/^<#[0-9]+>$/);
	
				if(firstArgumantMatch !== null && firstArgumantMatch['length'] === 1) {
					const channelId: string = firstArgumantMatch[0].slice(2, -1);
					
					if(typeof(client.getChannel(channelId)) !== 'undefined') {
						setting['value'] = channelId;
					}
				}
	
				break;
			}
	
			case SettingNames[SettingIndexes['hotPostCriteriaCount']]: {
				setting['key'] = SettingIndexes['hotPostCriteriaCount'];
	
				const firstArgumantMatch: RegExpMatchArray | null = _arguments[1].match(/^[1-9][0-9]*$/);
	
				if(firstArgumantMatch !== null && firstArgumantMatch['length'] === 1) {
					setting['value'] = _arguments[1];
				}
	
				break;
			}

			default: {
				logger.error('Invalid setting key');
			}
		}
	
		if(setting['value'] !== '') {
			prisma['setting'].update({
				select: null,
				where: { guildId_key: {
					guildId: message['guildID'] as string,
					key: setting['key']
				} },
				data: setting
			})
			.then(function (): void {
				switch(setting['key']) {
					case SettingIndexes['hotPostChannelId']: {
						setting['value'] = '<#' + setting['value'] + '>';

						break;
					}

					case SettingIndexes['isHotPostEnabled']:
					case SettingIndexes['isEmojiEnabled']: {
						setting['value'] = setting['value'] === '1' ? 'true' : 'false';
					}

					default: {
						setting['value'] = '**' + setting['value'] + '**';
					}
				}
	
				message['channel'].createMessage({
					embed: {
						color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
						title: 'DCBot | 설정',
						thumbnail: {
							url: 'https://cdn.h2owr.xyz/images/dcbot/logo.png'
						},
						description: _arguments[0] + '이 ' + setting['value'] + '(으)로 변경됨'
					}
				})
				.catch(logger.error);
	
				return;
			})
			.catch(logger.error);
		} else {
			logger.error('Invalid setting value (' + SettingNames[setting['key']] + ')');
		}
	} else {
		logger.error('Invalid setting arugment length');
	}
}, {
	aliases: ['지정'],
	guildOnly: true,
	requirements: { permissions: { administrator: true } }
}))
.addSubcommand(new Command('add', function (message: Message, _arguments: string[]): void {
	if(_arguments['length'] === 2) {
		const plainCommand: string = message['content'].slice(0, message['content']['length'] - _arguments[0]['length'] - _arguments[1]['length'] - 2);
		const isAddition: boolean = plainCommand.endsWith('add') || plainCommand.endsWith('추가');

		let settingKey: number = -1;
	
		switch(_arguments[0]) {
			case SettingNames[SettingIndexes['emojiBannedChannelIds']]: {
				settingKey = SettingIndexes['emojiBannedChannelIds'];
			}
			case SettingNames[SettingIndexes['hotPostBannedChannelIds']]: {
				if(settingKey === -1) {
					settingKey = SettingIndexes['hotPostBannedChannelIds'];
				}

				prisma['setting'].findFirst({
					select: { value: true },
					where: {
						guildId: message['guildID'],
						key: settingKey
					}
				})
				.then(function (_setting: Pick<Setting, 'value'> | null): void {
					if(_setting !== null) {
						const channelIds: Set<string> = new Set<string>(_setting['value'] !== '' ? _setting['value'].split(',') : undefined);
						const firstArgumantMatch: RegExpMatchArray | null = _arguments[1].match(/^<#[0-9]+>$/);
			
						if(firstArgumantMatch !== null && firstArgumantMatch['length'] === 1) {
							const channelId: string = firstArgumantMatch[0].slice(2, -1);

							if(typeof(client.getChannel(channelId)) !== 'undefined') {
								channelIds[isAddition ? 'add' : 'delete'](channelId);

								prisma['setting'].update({
									select: null,
									data: { value: Array.from(channelIds).join(',') },
									where: { guildId_key: {
										guildId: message['guildID'] as string,
										key: settingKey
									} }
								})
								.then(function (): void {
									message['channel'].createMessage({
										embed: {
											color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
											title: 'DCBot | 설정',
											thumbnail: {
												url: 'https://cdn.h2owr.xyz/images/dcbot/logo.png'
											},
											description: _arguments[0] + '이 **[' + (channelIds['size'] !== 0 ? '<#' + Array.from(channelIds).join('>, <#') + '>' : '') + ']**(으)로 변경됨'
										}
									})
									.catch(logger.error);

									return;
								})
								.catch(logger.error);
							} else {
								throw 'Invalid setting value (' + SettingNames[settingKey] + ')';
							}
						} else {
							throw 'Invalid setting value (' + SettingNames[settingKey] + ')';
						}
					} else {
						throw 'Invalid setting (' + message['guildID'] + ')';
					}
					
					return;
				})
				.catch(logger.error);

				break;
			}

			default: {
				logger.error('Invalid setting key');
			}
		}
	} else {
		logger.error('Invalid setting arugment length');
	}
}, {
	aliases: ['remove', '추가', '제거'],
	guildOnly: true,
	requirements: { permissions: { administrator: true } }
}));