import { prisma } from '@library/database';
import { Event } from '@library/framework';
import logger from '@library/logger';
import { HotPost, Setting } from '@prisma/client';
import { EmbedField, EmbedOptions, Message, PartialEmoji, PossiblyUncachedMessage, Uncached, User } from 'eris';
import { client } from '@application';
import { pageSize, SettingIndexes } from '@library/constant';
import { getHelpEmbed, getStringBetween } from '@library/utility';

export default new Event('messageReactionAdd', function (message: PossiblyUncachedMessage, reaction: PartialEmoji, reactor: User | Uncached): void {
	if(typeof(message['guildID']) === 'string' && reactor['id'] !== client['user']['id']) {
		client.getMessage(message['channel']['id'], message['id'])
		.then(function (message: Message): void {
			switch(reaction['name']) {
				case '⭐': {
					if(!message['author']['bot']) {
						prisma['setting'].findMany({
							select: { value: true },
							where: {
								guildId: message['guildID'],
								OR: [{ key: SettingIndexes['isHotPostEnabled'] }, { key: SettingIndexes['hotPostCriteriaCount'] }, { key: SettingIndexes['hotPostChannelId'] }, { key: SettingIndexes['hotPostBannedChannelIds'] }]
							}
						})
						.then(function (settings: Pick<Setting, 'value'>[]): void {
							if(settings[0]['value']/* isEmoticonEnabled */ === '1' && !settings[3]['value']/* hotPostBannedChannelIds */.split(',').includes(message['channel']['id'])) {
								if(settings['length'] === 4) {
									if(message['reactions']['⭐']['count'] >= Number.parseInt(settings[1]['value']/* hotPostCriteriaCount */, 10)) {
										prisma['hotPost'].findUnique({
											select: {
												messageId: true,
												recommendationCount: true
											},
											where: { originalMessageId: message['id'] }
										})
										.then(function (hotPost: Pick<HotPost, 'messageId'> | null): void {
											const hotPostContent: string = '🌟 **' + message['reactions']['⭐']['count'] + '** <#' + message['channel']['id'] + '>';
	
											if(hotPost !== null) {
												prisma['hotPost'].update({
													select: null,
													data: { recommendationCount: message['reactions']['⭐']['count'] },
													where: { originalMessageId: message['id'] }
												})
												.then(function (): void {
													client.editMessage(settings[2]['value']/* hotPostChannelId */, hotPost['messageId'], { content: hotPostContent })
													.catch(logger.error);
	
													return;
												})
												.catch(logger.error);
											} else {
												const hotPostEmbed: EmbedOptions = {
													color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
													author: {
														name: message['author']['username'] + '#' + message['author']['discriminator'],
														icon_url: message['author'].dynamicAvatarURL('png')
													},
													description: message['content'],
													fields: [{
														name: '원글',
														value: '[가기](' + message['jumpLink'] + ')',
														inline: false
													}],
													footer: { text: message['id'] },
													timestamp: new Date(message['createdAt'])
												};
	
												if(message['attachments']['length'] !== 0) {
													let fileList: string = '';
													let i: number = 0;
	
													if(typeof(message['attachments'][i]['filename']) === 'string' && /^(jp|pn)g|gifv?$/i.test(message['attachments'][i]['filename'].split('.').pop() as string)) {
														hotPostEmbed['image'] = message['attachments'][i];
	
														i++;
													}
	
													for(; i < message['attachments']['length']; i++) {
														const splitAttachementFilenames: string[] = message['attachments'][i]['filename'].split('.');
														const [attachmentExtension, attachmentName]: string[] = [splitAttachementFilenames['length'] !== 1 ? '.' + splitAttachementFilenames.pop() : '', splitAttachementFilenames.join('.')];
														const element: string = '[' + (attachmentName['length'] + attachmentExtension['length'] <= 15 ? attachmentName + attachmentExtension : attachmentName.slice(0, 14 - attachmentExtension['length'] - 7) + '...' + attachmentName.slice(-4) + attachmentExtension) + '](' + message['attachments'][i]['url'] + ')\n';
	
														if(fileList['length'] + element['length'] <= 1018) {
															fileList += element;
														} else {
															fileList += '*더...*';
	
															break;
														}
													}
	
													if(fileList['length'] !== 0) {
														(hotPostEmbed['fields'] as EmbedField[]).push({
															name: '첨부파일',
															value: fileList,
															inline: false
														});
													}
												}
	
												client.createMessage(settings[2]['value']/* hotPostChannelId */, {
													content: hotPostContent,
													embed: hotPostEmbed
												})
												.then(function (hotPostMessage: Message): void {
													prisma['hotPost'].create({
														select: null,
														data: {
															guildId: message['guildID'] as string,
															originalMessageId: message['id'],
															messageId: hotPostMessage['id'],
															recommendationCount: message['reactions']['⭐']['count']
														}
													})
													.catch(function (error: any): void {
														hotPostMessage.delete()
														.catch(logger.error);
	
														logger.error(error);
	
														return;
													});
	
													return;
												})
												.catch(logger.error);
											}
	
											return;
										})
										.catch(logger.error);
									}
								} else {
									logger.error('Invalid setting (' + message['guildID'] + ')');
								}
							}
	
							return;
						})
						.catch(logger.error);
					}
	
					break;
				}
	
				case '❌': {
					if(message['author']['id'] === client['user']['id'] && typeof(message['referencedMessage']) === 'object' && message['referencedMessage'] !== null && message['referencedMessage']['author']['id'] === reactor['id']) {
						message.delete()
						.catch(logger.error);
					}
	
					break;
				}
	
				case '◀':
				case '▶': {
					if(message['author']['id'] === client['user']['id']) {
						message.removeReaction(reaction['name'], reactor['id'])
						.then(function (): void {
							if(message['embeds']['length'] === 1 && message['embeds'][0]['title'] === 'DCBot | 도움') {
								const nextPageIndex: number = Number.parseInt(getStringBetween((message['embeds'][0] as Required<typeof message['embeds'][0]>)['footer']['text'], { ending: '/' }), 10) + (reaction['name'] === '▶' ? 1 : -1);
							
								if(!Number.isNaN(nextPageIndex) && nextPageIndex !== 0 && nextPageIndex <= Math.ceil(client['commandLabels']['length'] / pageSize)) {
									message.edit({ embed: getHelpEmbed(nextPageIndex - 1, pageSize) })
									.catch(logger.error);
								}
							}
		
							return;
						})
						.catch(logger.error);
					}
	
					break;
				}
			}

			return;
		})
		.catch(logger.error);
	}

	return;
});