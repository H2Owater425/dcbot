import { prisma } from '@library/database';
import { Event } from '@library/framework';
import logger from '@library/logger';
import { PossiblyUncachedGuild } from 'eris';

export default new Event('guildDelete', function (guild: PossiblyUncachedGuild): void {
	prisma['setting'].deleteMany({
		where: { guildId: guild['id'] }
	})
	.then(function (): void {
		logger.info('bye (' + guild['id'] + ')');

		return;
	})
	.catch(logger.error);

	return;
});