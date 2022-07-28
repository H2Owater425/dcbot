import { Event } from '@library/framework';
import { Message, PossiblyUncachedTextableChannel } from 'eris';
import { client } from '../application';

export default new Event('messageCreate', function (message: Message<PossiblyUncachedTextableChannel>): void {
	const emoticonArguments: string[] = message['content'].slice(1).split(' ');

	if(message['content'].charCodeAt(0) === process['env']['PREFIX'].charCodeAt(0) && !client['commandNames'].has(emoticonArguments[0])) {
		client.createMessage(message['channel']['id'], {
			content: emoticonArguments.join(',')
		});
	}

	return;
});