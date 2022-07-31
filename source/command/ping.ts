import { client } from "@application";
import { Command } from "@library/framework";
import logger from "@library/logger";
import { Message, Shard } from "eris";

export default new Command('!핑', function (message: Message): void {
	const latency: number = (client['shards'].get(client['guildShardMap'][message['guildID'] as string]) as Shard)['latency'];

	message['channel'].createMessage({
		content: Number.isFinite(latency) ? latency + 'ms' : '잠시후 다시 시도하세요',
		messageReference: { messageID: message['id'] }
	})
	.catch(logger.error);

	return;
}, {
	description: '핑 확인',
	aliases: ['!ping'],
	guildOnly: true
});