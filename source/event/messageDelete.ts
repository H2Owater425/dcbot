import { SettingIndexes } from '@library/constant';
import { prisma } from '@library/database';
import { Event } from '@library/framework';
import logger from '@library/logger';
import { HotPost, Setting } from '@prisma/client';
import { PossiblyUncachedMessage } from 'eris';
import { client } from '@application';

export default new Event('messageDelete', function (message: PossiblyUncachedMessage): void {
	prisma['hotPost'].findFirst({
		select: { messageId: true },
		where: { OR: [{ originalMessageId: message['id'] }, { messageId: message['id'] }] }
	})
	.then(function (hotPost: Pick<HotPost, 'messageId'> | null): void {
		if(hotPost !== null) {
			prisma['setting'].findMany({
				select: { value: true },
				where: {
					guildId: message['guildID'],
					OR: [{ key: SettingIndexes['isEmoticonEnabled'] }, { key: SettingIndexes['hotPostChannelId'] }]
				}
			})
			.then(function (settings: Pick<Setting, 'value'>[]): void {
				if(settings['length'] === 2) {
					if(settings[0]['value']/* isEmoticonEnabled */ === '1') {
						const isHotPost: boolean = message['id'] === hotPost['messageId'];

						prisma['hotPost'].delete({
							select: null,
							where: isHotPost ? { messageId: message['id'] } : { originalMessageId: message['id'] }
						})
						.then(function (): void {
							if(!isHotPost) {
								client.deleteMessage(settings[1]['value']/* hotPostChannelId */, hotPost['messageId'])
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

	return;
});