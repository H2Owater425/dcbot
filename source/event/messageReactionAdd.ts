import { prisma } from '@library/database';
import { Event } from '@library/framework';
import logger from '@library/logger';
import { HotPost, Setting } from '@prisma/client';
import { EmbedField, EmbedOptions, Message, PartialEmoji, PossiblyUncachedMessage } from 'eris';
import { client } from '../application';
import { settingIndexes } from '@library/constant';

export default new Event('messageReactionAdd', function (message: PossiblyUncachedMessage, emoji: PartialEmoji): void {
	if(typeof(message['guildID']) === 'string' && emoji['name'] === '⭐') {
		client.getMessage(message['channel']['id'], message['id'])
		.then(function (message: Message): void {
			if(!message['author']['bot']) {
				prisma['setting'].findMany({
					select: { value: true },
					where: {
						guildId: message['guildID'],
						OR: [{ key: settingIndexes['hotPostCriteriaCount'] }, { key: settingIndexes['hotPostChannelId'] }, { key: settingIndexes['hotPostBannedChannelIds'] }]
					}
				})
				.then(function (settings: Pick<Setting, 'value'>[]): void {
					if(!settings[2]['value']/* hotPostBannedChannelIds */.split(',').includes(message['channel']['id'])) {
						if(settings['length'] === 3) {
							if(message['reactions']['⭐']['count'] >= Number.parseInt(settings[0]['value']/* hotPostCriteriaCount */, 10)) {
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
											client.editMessage(settings[1]['value']/* hotPostChannelId */, hotPost['messageId'], { content: hotPostContent })
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
	
										client.createMessage(settings[1]['value']/* hotPostChannelId */, {
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

			return;
		})
		.catch(logger.error);
	}

	return;
});