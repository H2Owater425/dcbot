import { Event } from '@library/framework';
import logger from '@library/logger';

export default new Event('ready', function (): void {
	logger.info('ready'); // TODO: Change ready message more informative

	return;
});