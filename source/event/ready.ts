import { Event } from '@library/framework';
import logger from '@library/logger';
import { client } from '@application';

export default new Event('ready', function (): void {
	client.editStatus('online', {
		type: 3,
		name: process['env']['PREFIX'] + '!도움'
	});

	logger.info('ready as ' + client['user']['username'] + '(' + client['user']['id'] + ')'); // TODO: Change ready message more informative

	return;
});