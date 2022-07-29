import { Event } from '@library/framework';
import { EmbedOptions, Message, PossiblyUncachedTextableChannel } from 'eris';
import { client } from '../application';
import { fetchResponse, getDcinsideEmoticon, isValidTitle } from '@library/utility';
import logger from '@library/logger';
import { DcinsideEmoticon, Response } from '@library/type';
import { parse } from 'twemoji-parser';

export default new Event('messageCreate', function (message: Message<PossiblyUncachedTextableChannel>): void {
	const emoticonArguments: string[] = message['content'].slice(1).split(' ');

	if(message['content'].charCodeAt(0) === process['env']['PREFIX'].charCodeAt(0) && !client['commandNames'].has(emoticonArguments[0])) {
		const emoticonEmbed: EmbedOptions = {
			color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
			image: {},
			footer: { text: message['author']['username'] + '#' + message['author']['discriminator'] }
		};

		if(emoticonArguments['length'] === 1) {
			if(/^<a?:[A-z0-9]+:[0-9]+>$/.test(emoticonArguments[0])) {
				(emoticonEmbed as Required<typeof emoticonEmbed>)['image']['url'] = 'https://cdn.discordapp.com/emojis/' + emoticonArguments[0].split(':')[2].slice(0, -1) + '.' + (emoticonArguments[0].startsWith('<a:') ? 'gif' : 'png');

				client.createMessage(message['channel']['id'], {
					embed: emoticonEmbed,
					messageReference: {
						messageID: message['id']
					}
				})
				.catch(logger.error);
			} else if(/^(\p{Emoji}|\uFE0F|\u200d)+$/u.test(emoticonArguments[0])) {
				try {
					(emoticonEmbed as Required<typeof emoticonEmbed>)['image']['url'] = parse(emoticonArguments[0], { buildUrl: function (codepoints: string): string { return 'https://cdn.h2owr.xyz/images/twemoji/png/100x100/' + codepoints + '.png' } })[0]['url'];
	
					client.createMessage(message['channel']['id'], {
						embed: emoticonEmbed,
						messageReference: {
							messageID: message['id']
						}
					})
					.catch(logger.error);
				} catch(error: any) {
					logger.error(error);
				}
			} else {
				// TODO: Implement custom emoticon logic
			}
		} else {
			const emoticonImageInformation: string = emoticonArguments.pop() as string;
			const emoticonTitle: string = emoticonArguments.join(' ');

			if(isValidTitle(emoticonTitle, { maximumLength: 20 }) && isValidTitle(emoticonImageInformation, { maximumLength: 6 })) {
				getDcinsideEmoticon(emoticonTitle)
				.then(function (dcinsideEmoticon: DcinsideEmoticon): void {
					let imageIndex: number = -1;

					for(let i: number = 0; i < dcinsideEmoticon['images']['length']; i++) {
						if(dcinsideEmoticon['images'][i]['sort'] === emoticonImageInformation || dcinsideEmoticon['images'][i]['title'] === emoticonImageInformation) {
							imageIndex = i;
							
							break;
						}
					}

					if(imageIndex !== -1) {
						fetchResponse('https://dcimg5.dcinside.com/dccon.php?no=' + dcinsideEmoticon['images'][imageIndex]['path'], {
							method: 'GET'
						})
						.then(function (response: Response): void {
							const fileName: string = dcinsideEmoticon['index'] + '_' + imageIndex + '.' + dcinsideEmoticon['images'][imageIndex]['extension'];

							(emoticonEmbed as Required<typeof emoticonEmbed>)['image']['url'] = 'attachment://' + fileName;
							
							client.createMessage(message['channel']['id'], {
								embed: emoticonEmbed,
								messageReference: {
									messageID: message['id']
								}
							}, [{
								file: response['buffer'],
								name: fileName
							}])
							.catch(logger.error);
						})
						.catch(logger.error);
					}
				})
				.catch(logger.error);
			}
		}
	}

	return;
});