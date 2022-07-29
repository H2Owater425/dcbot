import { ClientRequest, IncomingMessage } from 'http';
import { request } from 'https';
import { ArcaLiveEmoticon, DcinsideEmoticon, RejectFunction, ResolveFunction, Response } from '@library/type';

export function isValidTitle(title: string, options: { maximumLength?: number; } = {}): boolean {
	if(typeof(options['maximumLength']) !== 'number') {
		options['maximumLength'] = Infinity;
	}

	if(title['length'] <= options['maximumLength']) {
		let titleLength: number = 0;

		for(let i: number = 0; i < title['length']; i++) {
			const currentCharacterCode: number = title.charCodeAt(i);
			
			if(12593 <= currentCharacterCode && currentCharacterCode <= 55203) {
				titleLength += 2;
			} else if(32 <= currentCharacterCode && currentCharacterCode <= 33 || 42 <= currentCharacterCode && currentCharacterCode <= 43 || 48 <= currentCharacterCode && currentCharacterCode <= 57 || 65 <= currentCharacterCode && currentCharacterCode <= 90 || 97 <= currentCharacterCode && currentCharacterCode <= 122) {
				titleLength++;
			} else {
				titleLength = 0;

				break;
			}
		}

		if(1 <= titleLength && titleLength <= (options as Required<typeof options>)['maximumLength']) {
			return true;
		}
	}

	return false;
}

export function fetchResponse(url: string, options: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {}): Promise<Response> {
	return new Promise<Response>(function (resolve: ResolveFunction<Response>, reject: RejectFunction): void {
		const _url: URL = new URL(url);

		const clientRequest: ClientRequest = request({
			hostname: _url['hostname'],
			path: _url['pathname'] + _url['search'],
			method: options['method'],
			port: 443,
			headers: options['headers']
		}, function (incomingMessage: IncomingMessage): void {
			const buffers: Buffer[] = [];
			let bufferLength: number = 0;

			if(incomingMessage['statusCode'] === 200) {
				incomingMessage.on('data', function (chunk: any): void {
					buffers.push(chunk);
					bufferLength += chunk['byteLength'];

					return;
				})
				.on('error', reject)
				.on('end', function (): void {
					resolve({
						buffer: Buffer.concat(buffers, bufferLength),
						header: incomingMessage['headers']
					});

					return;
				});
			} else {
				reject(new Error('Invalid response status code'));
			}

			return;
		});

		if(typeof(options['body']) !== 'undefined') {
			clientRequest.write(options['body']);
		}

		clientRequest.end();

		return;
	});
}

function getStringUntil(string: string, target: string): string {
	let targetIndex: number = 0;
	
	for(let i: number = 0; i < string['length']; i++) {
		if(string.slice(0, i).endsWith(target)) {
			targetIndex = i - target['length'];
		}
	}

	return string.slice(0, targetIndex);
}

export function getArcaLiveEmoticons(title: string): Promise<ArcaLiveEmoticon[]> {
	return new Promise<ArcaLiveEmoticon[]>(function (resolve: ResolveFunction<ArcaLiveEmoticon[]>, reject: RejectFunction): void {
		fetchResponse('https://arca.live/e/?target=title&keyword=' + title)
		.then(function (response: Response): void {
			const splitResponseTexts: string[] = response['buffer'].toString('utf-8').split('href="/e/');

			let emoticonId: number = NaN;

			for(let i: number = 1; i < splitResponseTexts['length']; i++) {
				const splitResponseTextMatchs: RegExpMatchArray | null = splitResponseTexts[i].match(/(?<=<div class="title">)[A-z0-9ㄱ-ㅎㅏ-ㅣ가-힣*^!~+\s]+(?=<\/div>)/g);
				
				if(splitResponseTextMatchs !== null && title === splitResponseTextMatchs[0]) {
					emoticonId = Number.parseInt(getStringUntil(splitResponseTexts[i], '?'), 10);

					break;
				}
			}

			if(!Number.isNaN(emoticonId)) {
				fetchResponse('https://arca.live/e/' + emoticonId)
				.then(function (response: Response): void {
					const splitResponseTexts: string[] = getStringUntil(response['buffer'].toString('utf-8'), '<div class="included-article-list">').split('<img loading="lazy" class="emoticon" src="');
					const arcaLiveEmoticons: ArcaLiveEmoticon[] = [];

					
					for(let i: number = 1; i < splitResponseTexts['length']; i++) {
						arcaLiveEmoticons.push({
							sort: String(i),
							url: 'https:' + getStringUntil(splitResponseTexts[i], '" data-id="')
						});
					}

					resolve(arcaLiveEmoticons);

					return;
				})
			} else {
				reject(new Error('Invalid title'));
			}
		})
		.catch(reject);

		return;
	});
}

export function getDcinsideEmoticons(title: string): Promise<DcinsideEmoticon[]> {
	return new Promise<DcinsideEmoticon[]>(function (resolve: ResolveFunction<DcinsideEmoticon[]>, reject: RejectFunction): void {
		fetchResponse('https://dccon.dcinside.com/hot/1/title/' + encodeURIComponent(title))
		.then(function (response: Response): void {
			const splitResponseTexts: string[] = response['buffer'].toString('utf-8').split('package_idx="');
			
			let packageIndex: number = NaN;

			for(let i: number = 1; i < splitResponseTexts['length']; i++) {
				const splitResponseTextMatchs: RegExpMatchArray | null = splitResponseTexts[i].match(/(?<=<strong class="dcon_name">)[A-z0-9ㄱ-ㅎㅏ-ㅣ가-힣*^!~+\s]+(?=<\/strong>)/g);

				if(splitResponseTextMatchs !== null && title === splitResponseTextMatchs[0]) {
					packageIndex = Number.parseInt(getStringUntil(splitResponseTexts[i], '"'), 10);

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
					const dcinsideEmoticons: DcinsideEmoticon[] = [];
					
					for(let i: number = 0; i < responseJson['info']['icon_cnt']; i++) {
						dcinsideEmoticons.push({
							sort: responseJson['detail'][i]['sort'],
							title: responseJson['detail'][i]['title'],
							path: responseJson['detail'][i]['path'],
							extension: responseJson['detail'][i]['ext']
						});
					}

					resolve(dcinsideEmoticons);

					return;
				})
				.catch(reject);
			} else {
				reject(new Error('Invalid title'));
			}

			return;
		})
		.catch(reject);

		return;
	});
}