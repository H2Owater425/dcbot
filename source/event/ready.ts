import { Event } from '@library/framework';
import logger from '@library/logger';
import { client } from '../application';

export default new Event('ready', function (): void {
	logger.info('ready as ' + client['user']['username'] + '(' + client['user']['id'] + ')'); // TODO: Change ready message more informative

	return;
});