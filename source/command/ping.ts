import { client } from "@application";
import { Command } from "@library/framework";
import logger from "@library/logger";
import { Message, Shard } from "eris";

export default new Command('!ping', function (message: Message): void {
	const latency: number = (client['shards'].get(client['guildShardMap'][message['guildID'] as string]) as Shard)['latency'];

	message['channel'].createMessage({
		content: Number.isFinite(latency) ? 'pong (' + latency + 'ms)' : 'Please try again later',
		messageReference: { messageID: message['id'] }
	})
	.catch(logger.error);

	return;
}, {
	aliases: ['!핑'],
	guildOnly: true
});