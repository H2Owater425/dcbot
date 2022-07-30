import { ReplyableError } from '@library/error';
import { Event } from '@library/framework';
import logger from '@library/logger';
import { client } from '@application';

export default new Event('error', function (error: Error, id?: number): void {
	if(error instanceof ReplyableError) {
		client.createMessage(error['discordMessage']['channel']['id'], {
			content: 'hell no',
			messageReference: { messageID: error['discordMessage']['id'] }
		})
		.catch(logger.error);
	} else {
		logger.error(error['message']);
	}

	return;
});