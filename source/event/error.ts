import { Event } from '@library/framework';
import { InternalError, InvalidUsage } from '@library/error';
import { client } from '../application';

export default new Event('error', function (error: Error, id?: number): void {
	if(error instanceof InvalidUsage) {
		client.createMessage(error['channelId'], {
			content: 'invalid usage'
		});
	} else if(error instanceof InternalError) {
		client.createMessage(error['channelId'], {
			content: 'internal error'
		});
	}
});