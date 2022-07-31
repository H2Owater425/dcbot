import { Command } from "@library/framework";
import logger from "@library/logger";
import { Message } from "eris";

export default new Command('!정보', function (message: Message): void {
	message['channel'].createMessage({
		embed: {
			color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
			title: 'DCBot | 정보',
			thumbnail: { url: 'https://cdn.h2owr.xyz/images/dcbot/logo.png' },
			description: '개발자: <@381745799723483136>\n깃허브: [https://github.com/H2Owater425/dcbot](https://github.com/H2Owater425/dcbot)'
		},
		messageReference: { messageID: message['id'] }
	})
	.catch(logger.error);

	return;
}, {
	aliases: ['!information', '!info'],
	description: '봇 정보 확인',
	guildOnly: true
});