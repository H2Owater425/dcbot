import { Event } from '@library/framework';
import { EmbedOptions, Message, PossiblyUncachedTextableChannel } from 'eris';
import { client } from '../application';
import logger from '@library/logger';
import { fetchResponse, getStringBetween, isValidTitle } from '@library/utility';
import { RejectFunction, ResolveFunction, Response } from '@library/type';
import { parse } from 'twemoji-parser';
import { prisma } from '@library/database';
import { SettingIndexes } from '@library/constant';
import { Setting } from '@prisma/client';

export default new Event('messageCreate', function (message: Message<PossiblyUncachedTextableChannel>): void {
	const emoticonArguments: string[] = message['content'].slice(1).split(' ');

	if(message['content'].charCodeAt(0) === process['env']['PREFIX'].charCodeAt(0) && !client['commandNames'].has(emoticonArguments[0])) {
		const emoticonEmbed: EmbedOptions = {
			color: Number.parseInt(process['env']['EMBED_COLOR'], 16),
			image: {},
			footer: { text: message['author']['username'] + '#' + message['author']['discriminator'] }
		};

		prisma['setting'].findMany({
			select: { value: true },
			where: {
				guildId: message['guildID'],
				OR: [{ key: SettingIndexes['isEmojiEnabled'] }, { key: SettingIndexes['emojiBannedChannelIds'] }]
			}
		})
		.then(function (settings: Pick<Setting, 'value'>[]): void {
			if(settings['length'] === 2) {
				if(settings[0]['value']/* isEmojiEnabled */ === '1' && !settings[1]['value']/* emojiBannedChannelIds */.split(',').includes(message['channel']['id'])) {
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
						const emoticonImageId: string = emoticonArguments.pop() as string;
						const emoticonTitle: string = emoticonArguments.join(' ');
			
						(new Promise<void>(function (resolve: ResolveFunction, reject: RejectFunction): void {
							if(isValidTitle(emoticonTitle, 20) && isValidTitle(emoticonImageId, 6)) {
								fetchResponse('https://dccon.dcinside.com/hot/1/title/' + encodeURIComponent(emoticonTitle))
								.then(function (response: Response): void {
									const splitResponseTexts: string[] = getStringBetween(response['buffer'].toString('utf-8'), {
										starting: '<ul class="dccon_shop_list hotdccon clear"',
										ending: '<!-- //인기순 디시콘 -->'
									}).split('package_idx="');
			
									let packageIndex: number = NaN;
			
									for(let i: number = 1; i < splitResponseTexts['length']; i++) {
										if(emoticonTitle === getStringBetween(splitResponseTexts[i], {
											starting: '<strong class="dcon_name">',
											ending: '</strong>'
										})) {
											packageIndex = Number.parseInt(getStringBetween(splitResponseTexts[i], { ending: '"' }), 10);
			
											break;
										}
									}
			
									if(!Number.isNaN(packageIndex)) {
										let cookie: string = '';
			
										if(Array.isArray(response['header']['set-cookie'])) {
											for(let i: number = 0; i < response['header']['set-cookie']['length']; i++) {
												if(response['header']['set-cookie'][i].startsWith('PHPSESSID=') || response['header']['set-cookie'][i].startsWith('ci_c=')) {
													cookie += response['header']['set-cookie'][i];
												}
											}
										}
			
										fetchResponse('https://dccon.dcinside.com/index/package_detail', {
											method: 'POST',
											headers: {
												Cookie: cookie,
												'Content-Type': 'application/x-www-form-urlencoded',
												'X-Requested-With': 'XMLHttpRequest'
											},
											body: 'package_idx=' + packageIndex
										})
										.then(function (response: Response): void {
											const responseJson: Record<string, any> = JSON.parse(response['buffer'].toString('utf-8'));
			
											let emoticonIndex: number = -1;
			
											for(let i: number = 0; i < responseJson['info']['icon_cnt']; i++) {
												if(responseJson['detail'][i]['sort'] === emoticonImageId || responseJson['detail'][i]['title'] === emoticonImageId) {
													emoticonIndex = i;
			
													break;
												}
											}
			
			
											if(emoticonIndex !== -1) {
												fetchResponse('https://dcimg5.dcinside.com/dccon.php?no=' + responseJson['detail'][emoticonIndex]['path'])
												.then(function (response: Response): void {
													const fileName: string = 'icon.' + responseJson['detail'][emoticonIndex]['ext'];
			
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
			
													return;
												})
												.catch(reject);
											} else {
												reject();
											}
			
											return;
										})
										.catch(reject);
									} else {
										reject();
									}
			
									return;
								})
								.catch(reject);
							} else {
								reject();
							}
			
							return;
						}))
						.catch(function (error: any): void {
							if(error instanceof Error) {
								logger.error(error['message']);
							}
			
							fetchResponse('https://arca.live/e/?target=title&keyword=' + emoticonTitle)
							.then(function (response: Response): void {
								const splitResponseTexts: string[] = getStringBetween(response['buffer'].toString('utf-8'), {
									starting: '판매순</span>',
									ending: '<div style="clear:both;">'
								}).split('href="/e/');
			
								let emoticonId: number = NaN;
			
								for(let i: number = 0; i < splitResponseTexts['length']; i++) {
									if(emoticonTitle === getStringBetween(splitResponseTexts[i], {
										starting: '<div class="title">',
										ending: '</div>'
									})) {
										emoticonId = Number.parseInt(getStringBetween(splitResponseTexts[i], { ending: '?' }), 10);
			
										break;
									}
								}
			
								if(!Number.isNaN(emoticonId)) {
									fetchResponse('https://arca.live/e/' + emoticonId)
									.then(function (response: Response): void {
										const splitResponseTexts: string[] = getStringBetween(response['buffer'].toString('utf-8'), {
											starting: '<div class="emoticons-wrapper">',
											ending: '<div class="included-article-list">'
										}).split('src="');
			
										const emoticonImageIndex: number = Number.parseInt(emoticonImageId, 10);
			
										if(!Number.isNaN(emoticonImageIndex) && emoticonImageIndex >= 1 && emoticonImageIndex < splitResponseTexts['length']) {
											(emoticonEmbed as Required<typeof emoticonEmbed>)['image']['url'] = 'https:' + getStringBetween(splitResponseTexts[emoticonImageIndex], { ending: '"' });
			
											if(((emoticonEmbed as Required<typeof emoticonEmbed>)['image']['url'] as string).endsWith('mp4')) {
												(emoticonEmbed as Required<typeof emoticonEmbed>)['image']['url'] += '.gif';
											}
			
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
								}
			
								return;
							})
							.catch(logger.error);
			
							return;
						});
					}
				}
			} else {
				logger.error('Invalid setting (' + message['guildID'] + ')');
			}

			return;
		})
		.catch(logger.error);
	}

	return;
});