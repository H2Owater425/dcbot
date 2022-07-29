import { ClientRequest, IncomingMessage } from 'http';
import { request } from 'https';
import { DcinsideEmoticon, RejectFunction, ResolveFunction, Response } from '@library/type';

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

export function getDcinsideEmoticon(title: string): Promise<DcinsideEmoticon> {
	return new Promise<DcinsideEmoticon>(function (resolve: ResolveFunction<DcinsideEmoticon>, reject: RejectFunction): void {
		fetchResponse('https://dccon.dcinside.com/hot/1/title/' + encodeURIComponent(title))
		.then(function (response: Response): void {
			const splitResponseTexts: string[] = response['buffer'].toString('utf-8').split('package_idx="');
			
			let packageIndex: number = NaN;

			for(let i: number = 1; i < splitResponseTexts['length']; i++) {
				const splitResponseTextMatchs: RegExpMatchArray | null = splitResponseTexts[i].match(/(?<=<strong class="dcon_name">)[A-z0-9ㄱ-ㅎㅏ-ㅣ가-힣*^!~+\s]+(?=<\/strong>)/g);

				if(splitResponseTextMatchs !== null && title === splitResponseTextMatchs[0]) {
					packageIndex = Number.parseInt(splitResponseTexts[i].split('"')[0], 10);

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
					const dcinsideEmoticon: DcinsideEmoticon = {
						title: responseJson['info']['title'],
						index: packageIndex,
						images: []
					};
					
					for(let i: number = 0; i < responseJson['info']['icon_cnt']; i++) {
						dcinsideEmoticon['images'].push({
							sort: responseJson['detail'][i]['sort'],
							title: responseJson['detail'][i]['title'],
							path: responseJson['detail'][i]['path'],
							extension: responseJson['detail'][i]['ext']
						});
					}

					resolve(dcinsideEmoticon);

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