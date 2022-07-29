import { Event } from '@library/framework';
import { EmbedOptions, Message, PossiblyUncachedTextableChannel } from 'eris';
import { client } from '../application';
import { fetchResponse, getArcaLiveEmoticons, getDcinsideEmoticons, isValidTitle } from '@library/utility';
import logger from '@library/logger';
import { ArcaLiveEmoticon, DcinsideEmoticon, RejectFunction, ResolveFunction, Response } from '@library/type';
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

			(new Promise<void>(function (resolve: ResolveFunction, reject: RejectFunction): void {
				if(isValidTitle(emoticonTitle, { maximumLength: 20 }) && isValidTitle(emoticonImageInformation, { maximumLength: 6 })) {
					getDcinsideEmoticons(emoticonTitle)
					.then(function (dcinsideEmoticons: DcinsideEmoticon[]): void {
						let emoticonIndex: number = -1;
	
						for(let i: number = 0; i < dcinsideEmoticons['length']; i++) {
							if(dcinsideEmoticons[i]['sort'] === emoticonImageInformation || dcinsideEmoticons[i]['title'] === emoticonImageInformation) {
								emoticonIndex = i;
								
								break;
							}
						}
	
						if(emoticonIndex !== -1) {
							fetchResponse('https://dcimg5.dcinside.com/dccon.php?no=' + dcinsideEmoticons[emoticonIndex]['path'])
							.then(function (response: Response): void {
								const fileName: string = 'icon.' + dcinsideEmoticons[emoticonIndex]['extension'];
	
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
								.then(function (): void {
									resolve();

									return;
								})
								.catch(logger.error);
							})
							.catch(reject);
						} else {
							reject();
						}
					})
					.catch(reject);
				} else {
					reject();
				}
			}))
			.catch(function (): void {
				getArcaLiveEmoticons(emoticonTitle)
				.then(function (arcaLiveEmoticons: ArcaLiveEmoticon[]): void {
					let emoticonIndex: number = -1;

					for(let i: number = 0; i < arcaLiveEmoticons['length']; i++) {
						if(arcaLiveEmoticons[i]['sort'] === emoticonImageInformation) {
							emoticonIndex = i;
							
							break;
						}
					}

					if(emoticonIndex !== -1) {
						(emoticonEmbed as Required<typeof emoticonEmbed>)['image']['url'] = arcaLiveEmoticons[emoticonIndex]['url'];

						client.createMessage(message['channel']['id'], {
							embed: emoticonEmbed,
							messageReference: {
								messageID: message['id']
							}
						})
						.catch(logger.error);
					}

					return;
				})
				.catch(logger.error);

				return;
			});
		}
	}

	return;
});