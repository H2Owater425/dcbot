import { SettingIndexes } from '@library/constant';
import { prisma } from '@library/database';
import { Event } from '@library/framework';
import logger from '@library/logger';
import { HotPost, Setting } from '@prisma/client';
import { Message, PartialEmoji, PossiblyUncachedMessage } from 'eris';
import { client } from '@application';

export default new Event('messageReactionRemove', function (message: PossiblyUncachedMessage, emoji: PartialEmoji): void {
	if(typeof(message['guildID']) === 'string' && emoji['name'] === '⭐') {
		prisma['hotPost'].findFirst({
			select: { messageId: true },
			where: { originalMessageId: message['id'] }
		})
		.then(function (hotPost: Pick<HotPost, 'messageId'> | null): void {
			if(hotPost !== null) {
				prisma['setting'].findMany({
					select: { value: true },
					where: {
						guildId: message['guildID'],
						OR: [{ key: SettingIndexes['isHotPostEnabled'] }, { key: SettingIndexes['hotPostCriteriaCount'] }, { key: SettingIndexes['hotPostChannelId'] }]
					}
				})
				.then(function (settings: Pick<Setting, 'value'>[]): void {
					if(settings['length'] === 3) {
						if(settings[0]['value']/* isHotPostEnabled */) {
							client.getMessage(message['channel']['id'], message['id'])
							.then(function (message: Message): void {
								if(typeof(message['reactions']['⭐']) === 'undefined' || message['reactions']['⭐']['count'] < Number.parseInt(settings[1]['value']/* hotPostCriteriaCount */, 10)) {
									prisma['hotPost'].delete({
										select: null,
										where: { originalMessageId: message['id'] }
									})
									.then(function (): void {
										client.deleteMessage(settings[2]['value']/* hotPostChannelId */, hotPost['messageId'])
										.catch(logger.error);

										return;
									})
									.catch(logger.error);
								} else {
									client.editMessage(settings[1]['value'], hotPost['messageId'], { content: '🌟 **' + message['reactions']['⭐']['count'] + '** <#' + message['channel']['id'] + '>' })
									.catch(logger.error);
								}

								return;
							})
							.catch(logger.error);
						}
					} else {
						logger.error('Invalid setting (' + message['guildID'] + ')');
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