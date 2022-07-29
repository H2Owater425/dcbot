import { prisma } from '@library/database';
import { Event } from '@library/framework';
import logger from '@library/logger';
import { Guild } from 'eris';
import { SettingIndexes } from '@library/constant';

export default new Event('guildCreate', function (guild: Guild): void {
	prisma['setting'].createMany({ data: [{
		guildId: guild['id'],
		key: SettingIndexes['isEmojiEnabled'],
		value: '1'
	}, {
		guildId: guild['id'],
		key: SettingIndexes['emojiBannedChannelIds'],
		value: ''
	}, {
		guildId: guild['id'],
		key: SettingIndexes['isHotPostEnabled'],
		value: '1'
	}, {
		guildId: guild['id'],
		key: SettingIndexes['hotPostCriteriaCount'],
		value: '3'
	}, {
		guildId: guild['id'],
		key: SettingIndexes['hotPostChannelId'],
		value: typeof(guild['publicUpdatesChannelID']) === 'string' ? guild['publicUpdatesChannelID'] : '' 
	}, {
		guildId: guild['id'],
		key: SettingIndexes['hotPostBannedChannelIds'],
		value: ''
	}] })
	.then(function (): void {
		// TODO: Add welcome message
		logger.info('hi (' + guild['id'] + ')');

		return;
	})
	.catch(logger.error);

	return;
});