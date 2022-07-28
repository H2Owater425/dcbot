import { prisma } from "@library/database";
import { Event } from "@library/framework";
import logger from "@library/logger";
import { Guild } from "eris";
import { settingIndexes } from "@library/constant";

export default new Event('guildCreate', function (guild: Guild): void {
	prisma['setting'].createMany({ data: [{
		guildId: guild['id'],
		key: settingIndexes['isEmojiEnabled'],
		value: '1'
	}, {
		guildId: guild['id'],
		key: settingIndexes['emojiBannedChannelIds'],
		value: ''
	}, {
		guildId: guild['id'],
		key: settingIndexes['isHotPostEnabled'],
		value: '1'
	}, {
		guildId: guild['id'],
		key: settingIndexes['hotPostCriteriaCount'],
		value: '3'
	}, {
		guildId: guild['id'],
		key: settingIndexes['hotPostChannelId'],
		value: guild['publicUpdatesChannelID']
	}, {
		guildId: guild['id'],
		key: settingIndexes['hotPostBannedChannelIds'],
		value: ''
	}] })
	.then(function (): void {
		// TODO: Add welcome message
	})
	.catch(logger.error);

	logger.info('hi (' + guild['id'] + ')');

	return;
});