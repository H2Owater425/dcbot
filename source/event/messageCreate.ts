import { Event } from '@library/framework';
import { EmbedOptions, Message, PossiblyUncachedTextableChannel } from 'eris';
import { client } from '../application';
import { getEmojiCodepoint } from '@library/utility';
import logger from '@library/logger';

export default new Event('messageCreate', function (message: Message<PossiblyUncachedTextableChannel>): void {
	const emoticonArguments: string[] = message['content'].slice(1).split(' ');

	if(message['content'].charCodeAt(0) === process['env']['PREFIX'].charCodeAt(0) && !client['commandNames'].has(emoticonArguments[0])) {
		const emoticonEmbed: EmbedOptions = {
			color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
			footer: { text: message['author']['username'] + '#' + message['author']['discriminator'] }
		};

		if(emoticonArguments['length'] === 1) {
			if(/^<a?:[A-z0-9]+:[0-9]+>$/.test(emoticonArguments[0])) {
				client.createMessage(message['channel']['id'], {
					embed: Object.assign(emoticonEmbed, { image: { url: 'https://cdn.discordapp.com/emojis/' + emoticonArguments[0].split(':')[2].slice(0, -1) + '.' + (emoticonArguments[0].startsWith('<a:') ? 'gif' : 'png') } }),
					messageReference: {
						messageID: message['id']
					}
				})
				.catch(logger.error);
			} else if(/^(\p{Emoji}|\uFE0F|\u200d)+$/u.test(emoticonArguments[0])) {
				client.createMessage(message['channel']['id'], {
					embed: Object.assign(emoticonEmbed, { image: { url: 'https://cdn.h2owr.xyz/images/twemoji/png/100x100/' + getEmojiCodepoint(emoticonArguments[0]) + '.png' } }),
					messageReference: {
						messageID: message['id']
					}
				})
				.catch(logger.error);
			} else {
				// TODO: Implement custom emoticon logic
			}
		} else {
			// TODO: Implement dccon logic
		}
	}

	return;
});