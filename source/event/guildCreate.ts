import { prisma } from '@library/database';
import { Event } from '@library/framework';
import logger from '@library/logger';
import { Guild } from 'eris';
import { SettingIndexes } from '@library/constant';
import { client } from '@application';

export default new Event('guildCreate', function (guild: Guild): void {
	prisma['setting'].createMany({ data: [{
		guildId: guild['id'],
		key: SettingIndexes['isEmoticonEnabled'],
		value: '0'
	}, {
		guildId: guild['id'],
		key: SettingIndexes['emoticonBannedChannelIds'],
		value: ''
	}, {
		guildId: guild['id'],
		key: SettingIndexes['isHotPostEnabled'],
		value: '0'
	}, {
		guildId: guild['id'],
		key: SettingIndexes['hotPostCriteriaCount'],
		value: '3'
	}, {
		guildId: guild['id'],
		key: SettingIndexes['hotPostChannelId'],
		value: '' 
	}, {
		guildId: guild['id'],
		key: SettingIndexes['hotPostBannedChannelIds'],
		value: ''
	}] })
	.then(function (): void {
		// TODO: Add welcome message
		logger.info('hi (' + guild['id'] + ')');

		client

		return;
	})
	.catch(logger.error);

	return;
});