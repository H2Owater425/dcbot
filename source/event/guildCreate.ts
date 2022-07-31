import { prisma } from '@library/database';
import { Event } from '@library/framework';
import logger from '@library/logger';
import { AnyGuildChannel, Constants, Guild, TextChannel } from 'eris';
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
		logger.info('hi (' + guild['id'] + ')');

		client.getRESTGuildChannels(guild['id'])
		.then(function (channels: AnyGuildChannel[]): void {
			let announcementChannelIndex: number = -1;

			for(let i: number = 0; i < channels['length']; i++) {
				if(channels[i]['type'] === Constants['ChannelTypes']['GUILD_TEXT'] && channels[i].permissionsOf(client['user']['id']).has('sendMessages')) {
					announcementChannelIndex = i;

					break;
				}
			}

			if(announcementChannelIndex !== -1) {
				(channels[announcementChannelIndex] as TextChannel).createMessage({ embed: {
					color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
					title: 'DCBot | 안내',
					thumbnail: { url: 'https://cdn.h2owr.xyz/images/dcbot/logo.png' },
					description: 'DCBot 사용을 환영합니다\n초기 설정 방법은 [이곳](https://github.com/H2Owater425/dcbot/blob/main/README.md)를 참고해주세요'
				} }).catch(logger.error);
			} else {
				logger.error('No channel for announcement (' + guild['id'] + ')');
			}

			return;
		})

		return;
	})
	.catch(logger.error);

	return;
});