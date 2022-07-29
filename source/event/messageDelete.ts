import { settingIndexes } from '@library/constant';
import { prisma } from '@library/database';
import { Event } from '@library/framework';
import logger from '@library/logger';
import { RejectFunction, ResolveFunction } from '@library/type';
import { HotPost, Setting } from '@prisma/client';
import { PossiblyUncachedMessage } from 'eris';
import { client } from '../application';

export default new Event('messageDelete', function (message: PossiblyUncachedMessage): void {
	prisma['hotPost'].findFirst({
		select: { messageId: true },
		where: { OR: [{ originalMessageId: message['id'] }, { messageId: message['id'] }] }
	})
	.then(function (hotPost: Pick<HotPost, 'messageId'> | null): void {
		if(hotPost !== null) {
			prisma['setting'].findFirst({
				select: { value: true },
				where: {
					guildId: message['guildID'],
					key: settingIndexes['hotPostChannelId']
				}
			})
			.then(function (setting: Pick<Setting, 'value'> | null): void {
				if(setting !== null) {
					const isHotPost: boolean = message['id'] === hotPost['messageId'];

					prisma['hotPost'].delete({
						select: null,
						where: isHotPost ? { messageId: message['id'] } : { originalMessageId: message['id'] }
					})
					.then(function (): void {
						if(!isHotPost) {
							client.deleteMessage(setting['value'], hotPost['messageId'])
							.catch(logger.error);
						}
					})
					.catch(logger.error);
				} else {
					logger.error('Invalid setting (' + message['guildID'] + ')');
				}
			})
			.catch(logger.error);
		}
	})
	.catch(logger.error);

	

	return;
});